"""
Ingest AWS DVA-C02 Markdown notes into a Chroma vector store using LangChain.
- Splits notes by Markdown headers (## domain, ### service)
- Generates embeddings via Ollama
- Persists vector store locally
"""

from pathlib import Path
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

NOTES_PATH = Path("notes/AWS DVA-C02 Notes.md")
PERSIST_DIR = "vectorstore"
COLLECTION_NAME = "aws_dva_c02_notes"
OLLAMA_BASE_URL = "http://localhost:11434"
EMBEDDING_MODEL = "nomic-embed-text:latest"

if __name__ == "__main__":
    
    # load the documents from the markdown notes
    loader = TextLoader( file_path=str(NOTES_PATH),encoding="utf-8" )
    documents = loader.load()
    raw_text = documents[0].page_content

    # split the notes into chunks according to the headers
    headers_definitions = [
        ("##", "domain"),   # domain headers such as Compute, Storage, etc. are denoted by headers of size 2 in the notes
        ("###", "service")  # notes about specific services are denoted by headers of size 3
    ]

    # define two splitters, one to segregate the notes by header, and another one to futher split the chunks generated 
    headers_splitter = MarkdownHeaderTextSplitter( headers_to_split_on=headers_definitions,strip_headers=False )
    content_splitter = RecursiveCharacterTextSplitter( chunk_size=1000,chunk_overlap=150 )

    headers_chunks = headers_splitter.split_text(raw_text)
    content_chunks = content_splitter.split_documents(headers_chunks)

    # enrich each chunk with exam-specific metadata. This allows to extend the chatbot for further certifications in the future
    for i, doc in enumerate(content_chunks):
        doc.metadata["exam"] = "DVA-C02"
        doc.metadata["source"] = NOTES_PATH.name
        doc.metadata["chunk_id"] = f"chunk_{i:04d}"

        # define fallbacks in case headers are missing
        doc.metadata.setdefault("domain", "Unknown")
        doc.metadata.setdefault("service", "General")

    # initialise the ollama-supplied embedding model
    embeddings = OllamaEmbeddings( model="nomic-embed-text:latest",base_url=OLLAMA_BASE_URL )

    # initialise the ChromaDB vector store with the embedded chunks
    vectorstore = Chroma.from_documents( documents=content_chunks,embedding=embeddings,persist_directory=PERSIST_DIR,collection_name=COLLECTION_NAME )