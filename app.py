import streamlit as st
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import torch
import numpy as np
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
        self.embeddings = []
        self.initialize_embeddings()
        self.doc_processor = DocumentProcessor()

    def load_knowledge_base(self):
        default_kb = [
            {"text": "To reset your password, visit the login page and click 'Forgot Password'.", "category": "account"},
            {"text": "Our refund policy allows returns within 30 days of purchase.", "category": "billing"},
        ]
        if os.path.exists('knowledge_base.json'):
            with open('knowledge_base.json', 'r') as f:
                return json.load(f)
        return default_kb

    def initialize_embeddings(self):
        texts = [item['text'] for item in self.knowledge_base]
        if texts:
            self.embeddings = self.embed_model.encode(texts)
            self.embeddings = np.array(self.embeddings)

    def update_knowledge_base(self, new_text):
        self.knowledge_base.append({"text": new_text, "category": "uploaded"})
        new_embedding = self.embed_model.encode([new_text])
        if len(self.embeddings) > 0:
            self.embeddings = np.vstack([self.embeddings, new_embedding])
        else:
            self.embeddings = new_embedding

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
            
            chunks = text.split('\n\n')
            for chunk in chunks:
                if len(chunk.strip()) > 50:
                    self.update_knowledge_base(chunk.strip())
            return True, f"Successfully processed {file.name}"
        except Exception as e:
            return False, f"Error processing file: {str(e)}"

    def retrieve_relevant_context(self, query, k=2):
        query_embedding = self.embed_model.encode([query])
        if len(self.embeddings) > 0:
            similarities = cosine_similarity(query_embedding, self.embeddings)[0]
            top_k_idx = np.argsort(similarities)[-k:][::-1]
            relevant_docs = [self.knowledge_base[i]['text'] for i in top_k_idx]
            return " ".join(relevant_docs)
        return ""

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

def main():
    st.set_page_config(page_title="IRENTEAI Support", page_icon="🤖", layout="wide")
    
    st.title("🤖 IRENTEAI Intelligent Support")
    
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    
    if 'support_bot' not in st.session_state:
        st.session_state.support_bot = CustomerSupportRAG()
    
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
    
    user_input = st.text_input("Your message:", key="user_input")
    
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
        
        st.experimental_rerun()
    
    for role, message in st.session_state.chat_history:
        if role == "user":
            st.write(f"You: {message}")
        else:
            st.write(f"Assistant: {message}")

if __name__ == "__main__":
    main()