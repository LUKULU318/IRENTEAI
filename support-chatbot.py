import streamlit as st
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import torch
import numpy as np
import faiss
import json
import os
import PyPDF2
import docx
import pandas as pd
from pathlib import Path
import tempfile

class DocumentProcessor:
    @staticmethod
    def read_pdf(file):
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text

    @staticmethod
    def read_docx(file):
        doc = docx.Document(file)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

    @staticmethod
    def read_txt(file):
        return file.read().decode('utf-8')

    @staticmethod
    def read_csv(file):
        df = pd.read_csv(file)
        return df.to_string()

class CustomerSupportRAG:
    def __init__(self):
        self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.tokenizer = AutoTokenizer.from_pretrained("facebook/opt-350m")
        self.model = AutoModelForCausalLM.from_pretrained("facebook/opt-350m")
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        self.knowledge_base = self.load_knowledge_base()
        self.index = None
        self.doc_processor = DocumentProcessor()
        self.initialize_index()

    def load_knowledge_base(self):
        default_kb = [
            {"text": "To reset your password, visit the login page and click 'Forgot Password'.", "category": "account"},
            {"text": "Our refund policy allows returns within 30 days of purchase.", "category": "billing"},
        ]
        
        # Load custom knowledge base if exists
        if os.path.exists('knowledge_base.json'):
            with open('knowledge_base.json', 'r') as f:
                return json.load(f)
        return default_kb

    def initialize_index(self):
        texts = [item['text'] for item in self.knowledge_base]
        embeddings = self.embed_model.encode(texts)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))

    def update_knowledge_base(self, new_text):
        # Add new text to knowledge base
        self.knowledge_base.append({"text": new_text, "category": "uploaded"})
        
        # Update index
        embedding = self.embed_model.encode([new_text])
        if self.index is None:
            dimension = embedding.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embedding).astype('float32'))

    def process_file(self, file):
        file_extension = Path(file.name).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                text = self.doc_processor.read_pdf(file)
            elif file_extension == '.docx':
                text = self.doc_processor.read_docx(file)
            elif file_extension == '.txt':
                text = self.doc_processor.read_txt(file)
            elif file_extension == '.csv':
                text = self.doc_processor.read_csv(file)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Split text into chunks and update knowledge base
            chunks = text.split('\n\n')  # Simple chunking strategy
            for chunk in chunks:
                if len(chunk.strip()) > 50:  # Only add substantial chunks
                    self.update_knowledge_base(chunk.strip())
            
            return True, f"Successfully processed {file.name}"
        except Exception as e:
            return False, f"Error processing file: {str(e)}"

    def retrieve_relevant_context(self, query, k=2):
        query_embedding = self.embed_model.encode([query])
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        relevant_docs = [self.knowledge_base[i]['text'] for i in indices[0]]
        return " ".join(relevant_docs)

    def generate_response(self, query, context):
        prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
        inputs = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
        outputs = self.model.generate(
            inputs["input_ids"],
            max_length=150,
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True,
            pad_token_id=self.tokenizer.eos_token_id
        )
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response.split("Answer:")[-1].strip()

    def analyze_sentiment(self, text):
        result = self.sentiment_analyzer(text)
        return result[0]['label']

def set_custom_theme():
    st.set_page_config(
        page_title="IRENTEAI Support",
        page_icon="🤖",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS
    st.markdown("""
        <style>
        .main {
            padding: 2rem;
        }
        .stButton>button {
            background-color: #FF4B4B;
            color: white;
            border-radius: 5px;
        }
        .chat-message {
            padding: 1rem;
            border-radius: 5px;
            margin-bottom: 1rem;
        }
        .user-message {
            background-color: #E8E8E8;
        }
        .bot-message {
            background-color: #F0F7FF;
        }
        </style>
    """, unsafe_allow_html=True)

def main():
    set_custom_theme()
    
    # Sidebar
    st.sidebar.title("IRENTEAI Support")
    st.sidebar.image("https://via.placeholder.com/150", caption="IRENTEAI")
    
    # Initialize session state
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    if 'support_bot' not in st.session_state:
        st.session_state.support_bot = CustomerSupportRAG()
    
    # Main content area
    st.title("🤖 IRENTEAI Intelligent Support")
    
    # File upload section
    st.header("📚 Knowledge Base Enhancement")
    uploaded_file = st.file_uploader(
        "Upload support documentation (PDF, DOCX, TXT, CSV)",
        type=['pdf', 'docx', 'txt', 'csv']
    )
    
    if uploaded_file:
        success, message = st.session_state.support_bot.process_file(uploaded_file)
        if success:
            st.success(message)
        else:
            st.error(message)
    
    # Chat interface
    st.header("💬 Chat Support")
    
    # Display chat history
    chat_container = st.container()
    with chat_container:
        for role, message in st.session_state.chat_history:
            if role == "user":
                st.markdown(f"""
                    <div class="chat-message user-message">
                        <b>You:</b> {message}
                    </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                    <div class="chat-message bot-message">
                        <b>IRENTEAI:</b> {message}
                    </div>
                """, unsafe_allow_html=True)
    
    # Chat input
    user_input = st.text_input("Type your message:", key="user_input")
    
    if user_input:
        context = st.session_state.support_bot.retrieve_relevant_context(user_input)
        bot_response = st.session_state.support_bot.generate_response(user_input, context)
        sentiment = st.session_state.support_bot.analyze_sentiment(user_input)
        
        st.session_state.chat_history.append(("user", user_input))
        st.session_state.chat_history.append(("bot", bot_response))
        
        if sentiment == "NEGATIVE":
            st.session_state.chat_history.append(
                ("bot", "I notice you seem frustrated. Would you like to speak with a human representative?")
            )
        
        # Rerun to update chat display
        st.experimental_rerun()

if __name__ == "__main__":
    main()
