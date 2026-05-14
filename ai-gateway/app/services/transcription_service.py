import os
import subprocess
from typing import Dict, Any

def transcribe_audio_whisper(audio_file_path: str, output_dir: str) -> Dict[str, Any]:
    """
    Transcribes audio/video files using local OpenAI Whisper CLI.
    Generates VTT (for H5P interactive video) and TXT formats.
    """
    
    # We use the whisper CLI (which requires whisper to be installed via pip)
    # Output formats: txt, vtt, srt, tsv, json
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Run Whisper locally (defaulting to 'base' model for speed, can be configured)
        command = [
            "whisper",
            audio_file_path,
            "--model", "base",
            "--output_dir", output_dir,
            "--output_format", "vtt"
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        
        # Also generate plain text for LLM chapter generation
        command_txt = [
            "whisper",
            audio_file_path,
            "--model", "base",
            "--output_dir", output_dir,
            "--output_format", "txt"
        ]
        subprocess.run(command_txt, capture_output=True, text=True, check=True)
        
        filename = os.path.basename(audio_file_path)
        base_name = os.path.splitext(filename)[0]
        
        vtt_path = os.path.join(output_dir, f"{base_name}.vtt")
        txt_path = os.path.join(output_dir, f"{base_name}.txt")
        
        with open(txt_path, "r", encoding="utf-8") as f:
            transcript_text = f.read()
            
        return {
            "status": "success",
            "vtt_file_path": vtt_path,
            "txt_file_path": txt_path,
            "transcript_preview": transcript_text[:500] + "..." if len(transcript_text) > 500 else transcript_text
        }
        
    except subprocess.CalledProcessError as e:
        print(f"Whisper Transcription Error: {e.stderr}")
        return {
            "status": "error",
            "error_message": str(e.stderr)
        }
