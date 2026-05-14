import fitz  # PyMuPDF
from typing import Dict, Any

def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parses a PDF file to extract raw text, page count, and metadata.
    """
    document = fitz.open(file_path)
    
    full_text = ""
    pages = []
    
    for page_num in range(len(document)):
        page = document.load_page(page_num)
        text = page.get_text("text")
        full_text += text + "\n"
        
        pages.append({
            "page_number": page_num + 1,
            "content": text.strip()
        })
        
    metadata = document.metadata
    
    document.close()
    
    return {
        "metadata": metadata,
        "total_pages": len(pages),
        "pages": pages,
        "full_text": full_text.strip()
    }
