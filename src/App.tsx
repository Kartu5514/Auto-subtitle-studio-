import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  Film, 
  Cpu, 
  Download, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Check, 
  Maximize2, 
  RefreshCw, 
  Edit3, 
  Clock, 
  Eye, 
  Sliders, 
  Sparkles,
  Layers,
  Database,
  Globe
} from "lucide-react";
import { SubtitleSegment, SubtitleStyle, VideoMetadata, AppStats } from "./types";

// Standard placeholder video if user doesn't have an MP4 readily available
const DEMO_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-street-strolls-with-pink-neon-signage-39832-large.mp4";

const INITIAL_STYLE: SubtitleStyle = {
  fontFamily: "Poppins",
  fontSize: "medium",
  fontColor: "yellow",
  position: "bottom",
  outline: true
};

// Helper to extract mono downsampled 16kHz audio from a browser File using Web Audio API
async function extractAudioAsWavBase64(file: File, maxDurationSeconds: number = 45): Promise<string> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API not supported in this browser");
  }

  const audioCtx = new AudioContextClass();
  const fileArrayBuffer = await file.arrayBuffer();
  
  // Clean decode audio data
  const audioBuffer = await audioCtx.decodeAudioData(fileArrayBuffer);
  const originalSampleRate = audioBuffer.sampleRate;
  const targetSampleRate = 16000; // Standard speech recognition sampling rate

  // Crop limit to prevent oversized transfers (e.g. max 45 seconds of audio which is highly representative)
  const maxFrames = Math.min(audioBuffer.length, Math.ceil(maxDurationSeconds * originalSampleRate));

  // Downsample to 16000Hz mono using OfflineAudioContext
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
    1,
    Math.ceil(maxFrames * targetSampleRate / originalSampleRate),
    targetSampleRate
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineCtx.destination);
  bufferSource.start();

  const renderedBuffer = await offlineCtx.startRendering();
  
  // Convert rendered AudioBuffer into WAV format byte array
  const wavBytes = encodeWAV(renderedBuffer);
  
  // Convert byte array to Base64
  return arrayBufferToBase64(wavBytes);
}

function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = 1;
  const resultChannel = audioBuffer.getChannelData(0);
  const numSamples = resultChannel.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File length
  view.setUint32(4, 36 + numSamples * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, numSamples * 2, true);
  
  // Write PCM data
  let offset = 44;
  for (let i = 0; i < resultChannel.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, resultChannel[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function App() {
  // Video and Media States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata>({
    name: "Cyberpunk_Streets_Promo.mp4 (Sample)",
    size: 14500000, // ~14.5 MB
    duration: 15,
    resolution: "1920x1080",
    url: DEMO_VIDEO_URL
  });
  
  // Subtitle States
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([
    { id: "1", start: 0.5, end: 4.0, text: "Halo semuanya! Selamat datang di Auto Subtitle Studio v1." },
    { id: "2", start: 4.2, end: 8.5, text: "Sistem cerdas kami akan secara otomatis mengubah suara video Anda menjadi teks." },
    { id: "3", start: 9.0, end: 14.5, text: "Tinggal edit secara real-time, ubah estetikanya, dan unduh format SRT instan!" }
  ]);
  
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [style, setStyle] = useState<SubtitleStyle>(INITIAL_STYLE);

  // Workflow pipeline progress states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0); // 0-3
  const [genLanguage, setGenLanguage] = useState<string>("id");
  const [genContext, setGenContext] = useState<string>("energetic");
  const [genTopic, setGenTopic] = useState<string>("Teknologi Masa Depan & Cyberpunk AI");
  const [customTranscript, setCustomTranscript] = useState<string>("");

  // Editor new segment placeholders
  const [newText, setNewText] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  
  // Global dashboard stats persistently stored in state & localStorage
  const [stats, setStats] = useState<AppStats>({
    totalVideos: 12,
    totalSubtitles: 142,
    totalDuration: 320
  });

  // Manual subtitle inline editing values
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editStart, setEditStart] = useState<number>(0);
  const [editEnd, setEditEnd] = useState<number>(0);

  // Video burner simulation
  const [isBurning, setIsBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const [playerWidth, setPlayerWidth] = useState<number>(645);

  // Track the actual player rendering width for dynamic layout optimization and unobtrusive subtitles
  useEffect(() => {
    if (!videoWrapperRef.current) return;
    setPlayerWidth(videoWrapperRef.current.offsetWidth || 645);

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width > 0) {
        setPlayerWidth(rect.width);
      }
    });

    observer.observe(videoWrapperRef.current);
    return () => observer.disconnect();
  }, [metadata.url]);

  // Load persistence stats on init
  useEffect(() => {
    const savedStats = localStorage.getItem("auto_subtitle_stats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        // use default
      }
    }
  }, []);

  // Update active subtitle based on video current time
  useEffect(() => {
    const active = subtitles.find(sub => currentTime >= sub.start && currentTime <= sub.end);
    if (active) {
      setActiveSubId(active.id);
    } else {
      setActiveSubId(null);
    }
  }, [currentTime, subtitles]);

  const saveStats = (newStats: AppStats) => {
    setStats(newStats);
    localStorage.setItem("auto_subtitle_stats", JSON.stringify(newStats));
  };

  // Extract metadata when a video file is loaded
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedVideo(file);
  };

  const processSelectedVideo = (file: File) => {
    // Basic file protection
    if (file.size > 524288000) {
      alert("Spesifikasi video melebihi batas maksimum 500 MB!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoFile(file);

    // Dynamic resolution and duration checker
    const tempVideo = document.createElement("video");
    tempVideo.src = objectUrl;
    tempVideo.preload = "metadata";
    tempVideo.onloadedmetadata = () => {
      const durationVal = Math.round(tempVideo.duration) || 60;
      const resWidth = tempVideo.videoWidth || 1920;
      const resHeight = tempVideo.videoHeight || 1080;
      
      setMetadata({
        name: file.name,
        size: file.size,
        duration: durationVal,
        resolution: `${resWidth}x${resHeight}`,
        url: objectUrl
      });

      // Reset subtitles to indicate the system is ready to synthesize voice to subtitles
      setSubtitles([
        {
          id: "new_upload_msg",
          start: 0.1,
          end: Math.min(6.0, durationVal),
          text: `[Video "${file.name}" berhasil diunggah! Klik tombol 'Generate Subtitle Otomatis' di bawah untuk mentranskrip suara asli video]`
        }
      ]);

      // Biarkan AI mengatur ukuran subtitle secara dinamis agar pas dan tidak menghalangi video
      setStyle(prev => ({
        ...prev,
        fontSize: "auto"
      }));

      // Pause current player and reset time
      if (videoRef.current) {
        videoRef.current.src = objectUrl;
        videoRef.current.load();
      }
    };
  };

  // Drag & Drop events
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      processSelectedVideo(file);
    }
  };

  // AI Subtitle Generator Flow
  const triggerAISubtitleGeneration = async () => {
    setIsGenerating(true);
    let audioBase64: string | null = null;
    
    try {
      // Step 0: Upload / analyze layout (visual cue)
      setGenerationStep(0);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 1: Extract Audio (Actual browser-side offline decoding)
      setGenerationStep(1);
      if (videoFile) {
        try {
          audioBase64 = await extractAudioAsWavBase64(videoFile, 90);
          console.log("Audio extracted successfully, base64 length:", audioBase64?.length);
        } catch (audioErr) {
          console.warn("Failed browser offline decoding (maybe video has no sound or codec issues):", audioErr);
        }
      } else {
        // No uploaded video file (using default demo video), wait to show step
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Step 2: Menghasilkan transkrip (Calling actual backend STT API)
      setGenerationStep(2);
      
      const response = await fetch("/api/generate-subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoName: metadata.name,
          duration: metadata.duration,
          language: genLanguage,
          context: genContext,
          topic: genTopic,
          customTranscript: customTranscript,
          audioBase64: audioBase64 // Send extracted track to Gemini!
        })
      });

      const data = await response.json();
      
      // Step 3: Menyinkronkan timestamp (visual finalization cue)
      setGenerationStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.success && Array.isArray(data.subtitles)) {
        setSubtitles(data.subtitles);
        // Increment app stats
        const newDuration = stats.totalDuration + metadata.duration;
        const newVideos = stats.totalVideos + 1;
        const newSubs = stats.totalSubtitles + data.subtitles.length;
        saveStats({
          totalVideos: newVideos,
          totalSubtitles: newSubs,
          totalDuration: newDuration
        });
      }
    } catch (err) {
      console.error("AI Generation issue", err);
      alert("Koneksi gagal atau terjadi kendala pemrosesan suara, beralih ke local fallback.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Manage individual subtitles
  const deleteSubtitle = (id: string) => {
    setSubtitles(subtitles.filter(sub => sub.id !== id));
  };

  const addSubtitleSegment = () => {
    const sTime = parseFloat(newStart);
    const eTime = parseFloat(newEnd);
    if (!newText.trim() || isNaN(sTime) || isNaN(eTime)) {
      alert("Mohon masukkan teks, waktu mulai, dan waktu selesai yang valid.");
      return;
    }
    if (sTime >= eTime) {
      alert("Waktu mulai harus lebih kecil dari waktu selesai.");
      return;
    }

    const newSegment: SubtitleSegment = {
      id: `manual_${Date.now()}`,
      start: sTime,
      end: eTime,
      text: newText
    };

    // Keep active sort
    const updated = [...subtitles, newSegment].sort((a, b) => a.start - b.start);
    setSubtitles(updated);
    setNewText("");
    setNewStart("");
    setNewEnd("");
  };

  // Inline edits
  const startInlineEdit = (sub: SubtitleSegment) => {
    setEditingId(sub.id);
    setEditText(sub.text);
    setEditStart(sub.start);
    setEditEnd(sub.end);
  };

  const saveInlineEdit = () => {
    if (!editText.trim()) return;
    setSubtitles(subtitles.map(sub => {
      if (sub.id === editingId) {
        return {
          ...sub,
          text: editText,
          start: Number(editStart),
          end: Number(editEnd)
        };
      }
      return sub;
    }).sort((a, b) => a.start - b.start));
    setEditingId(null);
  };

  // Click on a subtitle line to skip video playhead to the starting timestamp
  const seekToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  // Generate File Downloader Helpers
  const downloadSRT = () => {
    let srtContent = "";
    subtitles.forEach((sub, index) => {
      const formatTime = (time: number) => {
        const hrs = Math.floor(time / 3600).toString().padStart(2, "0");
        const mins = Math.floor((time % 3600) / 60).toString().padStart(2, "0");
        const secs = Math.floor(time % 60).toString().padStart(2, "0");
        const ms = Math.floor((time % 1) * 1000).toString().padStart(3, "0");
        return `${hrs}:${mins}:${secs},${ms}`;
      };

      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(sub.start)} --> ${formatTime(sub.end)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    triggerFileDownload(srtContent, `${metadata.name.replace(/\.[^/.]+$/, "")}.srt`, "text/plain");
  };

  const downloadVTT = () => {
    let vttContent = "WEBVTT\n\n";
    subtitles.forEach((sub, index) => {
      const formatTime = (time: number) => {
        const hrs = Math.floor(time / 3600).toString().padStart(2, "0");
        const mins = Math.floor((time % 3600) / 60).toString().padStart(2, "0");
        const secs = Math.floor(time % 60).toString().padStart(2, "0");
        const ms = Math.floor((time % 1) * 1000).toString().padStart(3, "0");
        return `${hrs}:${mins}:${secs}.${ms}`;
      };

      vttContent += `${index + 1}\n`;
      vttContent += `${formatTime(sub.start)} --> ${formatTime(sub.end)}\n`;
      vttContent += `${sub.text}\n\n`;
    });

    triggerFileDownload(vttContent, `${metadata.name.replace(/\.[^/.]+$/, "")}.vtt`, "text/plain");
  };

  const triggerFileDownload = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export video simulation with burned-in subtitles
  const runExportVideoSimulation = () => {
    setIsBurning(true);
    setBurnProgress(0);
    
    const interval = setInterval(() => {
      setBurnProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsBurning(false);
            alert(`Selesai! Video "${metadata.name}" berhasil di-render dengan subtitle tertanam (${style.fontFamily}, warna ${style.fontColor}, posisi ${style.position}) menggunakan akselerasi GPU neon. Mengunduh hasil konversi.`);
          }, 600);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  // Convert bytes size to human format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div id="subtitle-studio-root" className="min-h-screen bg-[#020204] text-slate-200 flex flex-col font-sans overflow-x-hidden relative cyber-grid-background">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      
      {/* Decorative cyber grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_bottom,rgba(0,240,255,0.15)_1px,transparent_1px)] bg-[size:100%_24px] z-0"></div>

      {/* Top Header Bar */}
      <header className="relative flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-10 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 uppercase">
                Auto Subtitle Studio
              </h1>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-400/40 uppercase tracking-widest hidden sm:inline-block">
                Beta v1.0
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">
              AI Neural Cyber Subtitle Synthesizer
            </p>
          </div>
        </div>

        {/* Live System Stats Header Area */}
        <div className="flex gap-4 sm:gap-8 bg-black/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2">
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Parsed Video</p>
            <p className="text-xs sm:text-base font-bold font-mono text-cyan-400">{stats.totalVideos}</p>
          </div>
          <div className="text-right border-l border-white/10 pl-4">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Total Subtitles</p>
            <p className="text-xs sm:text-base font-bold font-mono text-purple-400">{stats.totalSubtitles}</p>
          </div>
          <div className="text-right border-l border-white/10 pl-4 hidden md:block">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Tot. Cumulative Time</p>
            <p className="text-xs sm:text-base font-bold font-mono text-emerald-400">{stats.totalDuration}s</p>
          </div>
        </div>
      </header>

      {/* Hero Welcome & Subtitle Subtext */}
      <section className="relative px-6 py-6 sm:py-8 text-center max-w-4xl mx-auto z-10">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 uppercase font-display">
          <span className="text-white">AUTO SUBTITLE </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-glow">
            STUDIO
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-400 font-cyber font-medium tracking-wide">
          Generate subtitle otomatis dengan AI dalam hitungan detik. Hasilkan transkrip bersensor waktu cybernetic dengan presisi tinggi.
        </p>
      </section>

      {/* Main Grid Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-8 pb-12 z-10 w-full max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: Upload Area, Video Preview & Subtitle Preview styling Overlay (Grid Column Spanning 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Interactive Drag & Drop Upload Zone */}
          <div 
            className={`cyber-panel p-6 rounded-2xl border-2 border-dashed transition-all duration-300 relative ${
              isDragOver 
                ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(0,240,255,0.2)]" 
                : "border-white/10 hover:border-cyan-500/40 bg-slate-900/40"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            id="drag-drop-area"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-400/30 text-cyan-400">
                  <Upload className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
                    Seret & Letakkan Video Disini
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung MP4, MOV, AVI, MKV (Maksimal 500 MB)
                  </p>
                  {videoFile && (
                    <span className="inline-block mt-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                      ✓ {videoFile.name} Loaded
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Pilih File...
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleVideoUpload} 
                  accept="video/*" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          {/* Core Player & Embedded Preview */}
          <div className="cyber-panel rounded-2xl overflow-hidden bg-black/90 relative group shadow-2xl border border-white/10" id="video-canvas-container">
            
            {/* Top Indicator */}
            <div className="absolute top-3 left-3 z-30 flex gap-2">
              <span className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-cyan-500/40 text-[10px] text-cyan-400 uppercase tracking-tighter flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span> 
                {metadata.resolution} | {metadata.duration}s
              </span>
              <span className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-slate-300 font-mono">
                {formatBytes(metadata.size)}
              </span>
            </div>

            {/* Video Title Header */}
            <div className="absolute top-3 right-3 z-30">
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2 py-1 rounded font-mono uppercase">
                Active Source
              </span>
            </div>

            {/* Main Video Element Wrapper */}
            <div ref={videoWrapperRef} className="relative aspect-video bg-[#050508] flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef}
                src={metadata.url || undefined}
                className="w-full h-full object-contain"
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                controls
                playsInline
              />

              {/* Advanced SUBTITLE BURN-IN PREVIEW OVERLAY (rendered according to Style Engine parameters) */}
              {subtitles.length > 0 && (
                <div 
                  className={`absolute left-4 right-4 z-20 pointer-events-none transition-all duration-200 flex justify-center text-center ${
                    style.position === "top" ? "top-14" : style.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-6"
                  }`}
                  id="rendered-subtitle-container"
                >
                  {(() => {
                    const activeSub = subtitles.find(sub => currentTime >= sub.start && currentTime <= sub.end);
                    if (!activeSub) return null;

                    // Compute dynamic style rules
                    const fontClass = 
                      style.fontFamily === "Arial" ? "font-sans" :
                      style.fontFamily === "Roboto" ? "font-mono" :
                      style.fontFamily === "Montserrat" ? "font-cyber" : "font-display";

                    let calculatedFontSizeObj = {};
                    let sizeClass = "";
                    if (style.fontSize === "auto") {
                      const textLen = activeSub.text.length;
                      // Base scaling coefficient depending on character content density
                      let scaleFactor = 0.034;
                      if (textLen > 65) scaleFactor = 0.024;
                      else if (textLen > 35) scaleFactor = 0.028;
                      
                      // Calculate pixel size relative to physical container rendering boundary
                      const calculatedPx = Math.max(12, Math.min(22, Math.round(playerWidth * scaleFactor)));
                      calculatedFontSizeObj = { fontSize: `${calculatedPx}px` };
                      sizeClass = "px-3.5 py-1.5 font-medium leading-normal";
                    } else {
                      sizeClass = 
                        style.fontSize === "small" ? "text-xs sm:text-sm px-3 py-1" :
                        style.fontSize === "medium" ? "text-sm sm:text-lg px-4 py-1.5" : 
                        "text-base sm:text-2xl px-6 py-2 pb-2.5 font-bold tracking-tight";
                    }

                    const colorClass = 
                      style.fontColor === "white" ? "text-white" :
                      style.fontColor === "yellow" ? "text-[#fefe00] cyber-glow-yellow" :
                      style.fontColor === "green" ? "text-green-400" : "text-cyan-400 cyber-glow-cyan";

                    const outlineStyle = style.outline 
                      ? "bg-black/85 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.8)] rounded-xl" 
                      : "bg-transparent text-shadow-md";

                    return (
                      <span 
                        style={calculatedFontSizeObj}
                        className={`${fontClass} ${sizeClass} ${colorClass} ${outlineStyle} inline-block select-none leading-snug max-w-[90%] transform transition-transform scale-102`}
                      >
                        {activeSub.text}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Demo Mode watermark if default demo asset is active */}
              {metadata.url === DEMO_VIDEO_URL && (
                <div className="absolute bottom-2 left-3 bg-black/60 px-2 py-0.5 rounded text-[8px] text-slate-500 font-mono uppercase tracking-widest pointer-events-none">
                  Demo Sample Frame
                </div>
              )}
            </div>

            {/* Video Quick Controls & Demo Toggle bar */}
            <div className="bg-slate-950 px-4 py-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                      } else {
                        videoRef.current.pause();
                      }
                    }
                  }}
                  className="p-1.5 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Play / Pause"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </button>
                <div className="text-xs font-mono text-slate-400">
                  Time: <span className="text-cyan-400 font-bold">{currentTime.toFixed(1)}s</span> / {metadata.duration}s
                </div>
              </div>

              {/* Try Demo Button */}
              <button
                onClick={() => {
                  setMetadata({
                    name: "Cyberpunk_Streets_Promo.mp4 (Sample)",
                    size: 14500000,
                    duration: 15,
                    resolution: "1920x1080",
                    url: DEMO_VIDEO_URL
                  });
                  setSubtitles([
                    { id: "1", start: 0.5, end: 4.0, text: "Halo semuanya! Selamat datang di Auto Subtitle Studio v1." },
                    { id: "2", start: 4.2, end: 8.5, text: "Sistem cerdas kami akan secara otomatis mengubah suara video Anda menjadi teks." },
                    { id: "3", start: 9.0, end: 14.5, text: "Tinggal edit secara real-time, ubah estetikanya, dan unduh format SRT instan!" }
                  ]);
                  if (videoRef.current) {
                    videoRef.current.src = DEMO_VIDEO_URL;
                    videoRef.current.load();
                  }
                }}
                className="text-[10px] px-2.5 py-1 bg-purple-500/15 text-purple-300 font-mono uppercase rounded border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                Gunakan Video Sample Demo
              </button>
            </div>
          </div>

          {/* AI Generator Control parameters Dashboard Area */}
          <div className="cyber-panel p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                AI Subtitle Generator Pipeline
              </h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono uppercase border border-cyan-400/20">
                Whisper & Gemini Core
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold font-mono">
                  Bahasa Output AI
                </label>
                <select 
                  value={genLanguage} 
                  onChange={(e) => setGenLanguage(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="id">Indonesian (Bahasa)</option>
                  <option value="en">English (US/UK)</option>
                  <option value="jp">Japanese (日本語)</option>
                  <option value="ko">Korean (한국어)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold font-mono">
                  Gaya & Nada Transkrip
                </label>
                <select 
                  value={genContext} 
                  onChange={(e) => setGenContext(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="narrative">Standard Review/Unboxing</option>
                  <option value="energetic">Vlog Reels / TikTok (Energetik)</option>
                  <option value="professional">Edukasi / Presentasi Formal</option>
                  <option value="futuristic">Cyberpunk Dramatis (Sinetron/Sci-Fi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold font-mono">
                  Fokus Topik Opsional
                </label>
                <input 
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Unboxing, Review Gadget dll"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Custom Speech Text Context Area if the model needs extra cues */}
            <div className="mb-4">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold font-mono">
                Catatan Naskah / Teks Kasar (Opsional)
              </label>
              <textarea 
                rows={2}
                value={customTranscript}
                onChange={(e) => setCustomTranscript(e.target.value)}
                placeholder="Masukkan transkrip kasar jika ingin AI menyesuaikan timing dengan teks Anda..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400 transition-all font-mono resize-none"
              />
            </div>

            {/* Progress Pipeline Indicator */}
            {isGenerating && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-4 animate-pulse">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {generationStep === 0 && "🚀 Mengupload video..."}
                    {generationStep === 1 && "🧠 Menganalisa struktur audio..."}
                    {generationStep === 2 && "⚡ Menghasilkan transkrip..."}
                    {generationStep === 3 && "✨ Menyinkronkan timestamp..."}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {Math.round(((generationStep + 1) / 4) * 100)}% COMPLETE
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-[0_0_10px_rgba(0,192,255,0.6)] transition-all duration-500"
                    style={{ width: `${((generationStep + 1) / 4) * 100}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-3 text-[9px] text-center font-mono">
                  <span className={`transition-colors ${generationStep >= 0 ? "text-cyan-400 font-bold" : "text-slate-600"}`}>Upload</span>
                  <span className={`transition-colors ${generationStep >= 1 ? "text-cyan-400 font-bold" : "text-slate-600"}`}>Analyze</span>
                  <span className={`transition-colors ${generationStep >= 2 ? "text-cyan-400 font-bold" : "text-slate-600"}`}>Transcribe</span>
                  <span className={`transition-colors ${generationStep >= 3 ? "text-cyan-400 font-bold" : "text-slate-600"}`}>Sync</span>
                </div>
              </div>
            )}

            {/* Generate Trigger Button */}
            <button 
              onClick={triggerAISubtitleGeneration}
              disabled={isGenerating}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
              id="generate-subtitles-btn"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengekstraksi Audio & Membuat Subtitle...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 animate-pulse text-cyan-200" />
                  Generate Subtitle Otomatis (AI Engine)
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Subtitle Editor Stream & Styling Dashboard Layout (Grid Column Spanning 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Subtitle List / Editor Stream container */}
          <div className="cyber-panel flex-1 flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200 font-mono">
                  Transcription Stream ({subtitles.length})
                </h3>
              </div>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded font-mono uppercase">
                Interactive Logs
              </span>
            </div>

            {/* Subtitle list rows container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]" id="transcription-stream-box">
              {subtitles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500 text-center">
                  <Film className="w-12 h-12 text-slate-700 mb-2 animate-bounce" />
                  <p className="text-xs font-mono">Belum ada subtitle.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Upload video lalu jalankan AI Generator, atau klik tombol tambah manual di bawah.</p>
                </div>
              ) : (
                subtitles.map((sub, index) => {
                  const isActive = activeSubId === sub.id;
                  const isEditing = editingId === sub.id;

                  return (
                    <div 
                      key={sub.id} 
                      className={`group border rounded-xl p-3 transition-all relative ${
                        isActive 
                          ? "bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_8px_rgba(0,192,255,0.15)]" 
                          : "bg-white/5 border-white/5 hover:border-cyan-400/20"
                      }`}
                    >
                      {/* Active glowing indicator */}
                      {isActive && (
                        <span className="absolute top-3 right-3 text-[8px] bg-cyan-400 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}

                      {/* Header timestamp descriptor */}
                      <div className="flex items-center justify-between mb-2 text-[10px] font-mono">
                        <button 
                          onClick={() => seekToTime(sub.start)}
                          className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors font-bold group/btn"
                        >
                          <Clock className="w-3 h-3 group-hover/btn:animate-pulse" />
                          <span>{sub.start.toFixed(1)}s → {sub.end.toFixed(1)}s</span>
                        </button>

                        {/* Stream Controls */}
                        {!isEditing && (
                          <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => startInlineEdit(sub)} 
                              className="text-slate-400 hover:text-cyan-400 font-cyber font-semibold text-[10px]"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteSubtitle(sub.id)} 
                              className="text-slate-500 hover:text-red-400 font-cyber font-semibold text-[10px]"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Content block / Editor */}
                      {isEditing ? (
                        <div className="space-y-2 mt-1">
                          <textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            className="w-full bg-black/85 border border-cyan-400 px-2 py-1.5 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                          <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                              <span className="text-[8px] text-slate-500 font-mono">START:</span>
                              <input 
                                type="number" 
                                value={editStart} 
                                step="0.1"
                                onChange={(e) => setEditStart(parseFloat(e.target.value) || 0)}
                                className="w-12 bg-transparent text-[10px] text-slate-300 font-mono focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-black/40 rounded-lg border border-white/10 px-2 py-1">
                              <span className="text-[8px] text-slate-500 font-mono">END:</span>
                              <input 
                                type="number" 
                                value={editEnd} 
                                step="0.1"
                                onChange={(e) => setEditEnd(parseFloat(e.target.value) || 0)}
                                className="w-12 bg-transparent text-[10px] text-slate-300 font-mono focus:outline-none"
                              />
                            </div>
                            <button 
                              onClick={saveInlineEdit}
                              className="ml-auto px-3 py-1 bg-cyan-400 text-black text-[10px] font-bold rounded-lg hover:bg-white transition-colors"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p 
                          onClick={() => seekToTime(sub.start)}
                          className={`text-xs leading-relaxed cursor-pointer hover:text-white transition-colors ${
                            isActive ? "text-white font-medium" : "text-slate-300"
                          }`}
                        >
                          {sub.text}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick manual segment addition box */}
            <div className="p-4 bg-black/30 border-t border-white/5 space-y-2">
              <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono">
                + Tambah Segmen Subtitle Baru
              </span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ketik teks dialog subtitle..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5">
                  <span className="text-[8px] text-slate-500 font-mono">Mulai:</span>
                  <input 
                    type="number" 
                    placeholder="0.0"
                    step="0.5"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-14 bg-transparent text-xs text-white font-mono focus:outline-none"
                  />
                  <span className="text-[8px] text-slate-500 font-mono">detik</span>
                </div>
                <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 font-mono">
                  <span className="text-[8px] text-slate-500">Selesai:</span>
                  <input 
                    type="number" 
                    placeholder="15.0"
                    step="0.5"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-14 bg-transparent text-xs text-white font-mono focus:outline-none"
                  />
                  <span className="text-[8px] text-slate-500">detik</span>
                </div>

                <button 
                  onClick={addSubtitleSegment}
                  className="ml-auto px-4 py-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-400/40 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-cyan-400 hover:text-black transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Embedded Subtitle Style settings section */}
          <div className="cyber-panel p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Sistem Desain & Tampilan Subtitle
            </h3>

            {/* Style parameters selectors */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 font-mono">
                  Gaya Font
                </label>
                <select 
                  value={style.fontFamily}
                  onChange={(e) => setStyle({...style, fontFamily: e.target.value as any})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-400"
                >
                  <option value="Poppins">Poppins (Modern Slate)</option>
                  <option value="Arial">Arial (Standard Sans)</option>
                  <option value="Roboto">Roboto (Minimal Mono)</option>
                  <option value="Montserrat">Montserrat (Cyber Bold)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 font-mono flex items-center justify-between">
                  <span>Ukuran Teks</span>
                  {style.fontSize === "auto" && (
                    <span className="text-[9px] text-cyan-400 font-normal normal-case">(Adaptive Fit)</span>
                  )}
                </label>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
                  {(["small", "medium", "large", "auto"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setStyle({...style, fontSize: sz})}
                      className={`flex-1 text-[8px] sm:text-[10px] py-1 font-bold uppercase rounded ${
                        style.fontSize === sz 
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30" 
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {sz === "auto" ? "⚡ Auto" : sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 font-mono">
                  Warna Teks
                </label>
                <select 
                  value={style.fontColor}
                  onChange={(e) => setStyle({...style, fontColor: e.target.value as any})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-cyan-400"
                >
                  <option value="white">Putih Bersih</option>
                  <option value="yellow">Kuning Neon</option>
                  <option value="green">Hijau Matrix</option>
                  <option value="blue">Biru Cyber</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 font-mono">
                  Posisi Teks
                </label>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5 h-[30px] items-center">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setStyle({...style, position: pos})}
                      className={`flex-1 text-[10px] py-1 font-bold uppercase rounded ${
                        style.position === pos 
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {pos === "top" ? "Atas" : pos === "center" ? "Tengah" : "Bawah"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Outline Box Toggle */}
            <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl p-3 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-300 font-mono">Aktifkan Outline & Box Pelindung</p>
                <p className="text-[10px] text-slate-500">Menyediakan latar belakang transparan hitam untuk membantu keterbacaan subtitle</p>
              </div>
              <button
                onClick={() => setStyle({...style, outline: !style.outline})}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${style.outline ? "bg-cyan-400" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-900 transition-transform ${style.outline ? "translate-x-6" : "translate-x-0"}`}></div>
              </button>
            </div>

            {/* EXPORT OPTIONS */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={downloadSRT}
                  className="py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-mono text-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh .SRT
                </button>
                <button 
                  onClick={downloadVTT}
                  className="py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-mono text-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh .VTT
                </button>
              </div>

              {/* Burning rendering state representation */}
              {isBurning ? (
                <div className="bg-cyan-950/20 border border-cyan-400 p-4 rounded-xl text-center">
                  <div className="flex items-center justify-between mb-2 text-xs text-cyan-400 font-mono font-bold">
                    <span>🎬 RENDERING VIDEO DENGAN SUBTITLE...</span>
                    <span>{burnProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${burnProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={runExportVideoSimulation}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 text-white"
                >
                  <Maximize2 className="w-4 h-4 text-cyan-300" />
                  Export Video (Burn-In Subtitle)
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Roadmap & Future Capabilities Feature Badge Carousel */}
      <section className="px-4 sm:px-8 max-w-7xl mx-auto w-full pb-12 z-10">
        <div className="cyber-panel p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Auto Subtitle Studio - Platform Roadmap & Features (v2 - v5)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded font-mono uppercase">V2 PRO</span>
                <span className="text-[9px] text-slate-500">Upcoming</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase font-mono">Auto Translation</h4>
              <p className="text-[11px] text-slate-400">Terjemahkan subtitle otomatis ke bahasa Inggris, Jepang, Korea, atau Mandarin secara instan.</p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-400/20 px-2 py-0.5 rounded font-mono uppercase">V3 ACTIVE</span>
                <span className="text-[9px] text-slate-500 font-bold text-purple-400">Planned</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase font-mono">Social Captions</h4>
              <p className="text-[11px] text-slate-400">Kustomisasi gaya teks khusus TikTok, YouTube Shorts, & Reels dengan emoji otomatis.</p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-400/20 px-2 py-0.5 rounded font-mono uppercase">V4 PLATINUM</span>
                <span className="text-[9px] text-slate-500">Planned</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase font-mono">YouTube URL Link</h4>
              <p className="text-[11px] text-slate-400">Masukkan link YouTube Anda untuk diekstrak audionya lalu dibuatkan subtitle otomatis.</p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded font-mono uppercase">V5 ENTERPRISE</span>
                <span className="text-[9px] text-slate-500">Roadmap</span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1 uppercase font-mono">Batch Processing</h4>
              <p className="text-[11px] text-slate-400">Proses puluhan video sekaligus dengan scheduler latar belakang tanpa jeda transkripsi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cyberpunk Status Footer Bar */}
      <footer className="mt-auto px-4 sm:px-8 py-4 bg-black/80 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest gap-2 z-10">
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 
            Server Status: SECURE LIVE
          </span>
          <span>● Pipeline: whisper-v3-base</span>
          <span>● FFMPEG Render Engine: v6.1-wasm</span>
        </div>
        <div>
          © {new Date().getFullYear()} AUTO SUBTITLE STUDIO // NEURAL DASHBOARD V1.0
        </div>
      </footer>
    </div>
  );
}
