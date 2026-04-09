#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script untuk mengambil data REAL-TIME dari Web API BPS
Menggunakan Static Table API - Data resmi dari BPS
"""

import sys
import json
import re
from datetime import datetime

# Set encoding untuk Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Import stadata library
try:
    import stadata
except ImportError:
    print(json.dumps({
        "success": False,
        "message": "Library stadata tidak terinstall. Jalankan: pip install stadata"
    }, ensure_ascii=False))
    sys.exit(1)

# Konfigurasi
BPS_API_TOKEN = "262f8ec7c3d56fe547d7f843a9391a87"
DOMAIN_CODE = "1508"  # Kode domain untuk Tanjung Jabung Barat

# Subject IDs berdasarkan CSA Classification BPS
# Sumber: https://webapi.bps.go.id/v1/api/subject
SUBJECT_IDS = {
    "penduduk": {
        "id": 519,
        "name": "Population and migration",
        "indonesia": "Kependudukan dan migrasi"
    },
    "kemiskinan": {
        "id": 523,
        "name": "Poverty and equity",
        "indonesia": "Kemiskinan dan ketimpangan"
    },
    "pdrb": {
        "id": 524,
        "name": "National accounts",
        "indonesia": "PDRB"
    },
    "ipm": {
        "id": 525,
        "name": "Human development indices",
        "indonesia": "Indeks pembangunan manusia"
    },
    "pendidikan": {
        "id": 521,
        "name": "Education",
        "indonesia": "Pendidikan"
    },
    "kesehatan": {
        "id": 522,
        "name": "Health",
        "indonesia": "Kesehatan"
    },
    "ketenagakerjaan": {
        "id": 520,
        "name": "Labour",
        "indonesia": "Ketenagakerjaan"
    }
}

# Inisialisasi client
try:
    client = stadata.Client(BPS_API_TOKEN)
    print("BPS Client initialized successfully", file=sys.stderr)
except Exception as e:
    print(json.dumps({
        "success": False,
        "message": f"Gagal koneksi ke API BPS: {str(e)}"
    }, ensure_ascii=False))
    sys.exit(1)

def normalize_query(query):
    """Normalisasi query dan perbaiki typo"""
    query_lower = query.lower()
    typo_fixes = {
        'kemisikinan': 'kemiskinan',
        'pendduk': 'penduduk',
        'prdb': 'pdrb',
        'ipnm': 'ipm'
    }
    for typo, correct in typo_fixes.items():
        query_lower = query_lower.replace(typo, correct)
    return query_lower

def extract_year(query):
    """Ekstrak tahun dari query"""
    current_year = datetime.now().year
    match = re.search(r'20[0-9]{2}', query)
    if match:
        return match.group()
    # Default ke tahun sebelumnya karena data tahun berjalan belum lengkap
    return str(current_year - 1)

def detect_indicator(query):
    """Deteksi indikator dari query"""
    normalized = normalize_query(query)
    is_latest = any(word in normalized for word in ['terbaru', 'baru', 'sekarang', 'update', 'latest'])
    
    for indicator in SUBJECT_IDS.keys():
        if indicator in normalized:
            return indicator, is_latest
    
    # Cek dengan keyword tambahan
    keyword_map = {
        "penduduk": ["jiwa", "populasi", "jumlah penduduk"],
        "kemiskinan": ["miskin", "fakir", "kemisikinan"],
        "pdrb": ["ekonomi", "gdp", "produk domestik"],
        "ipm": ["indeks pembangunan manusia", "pembangunan manusia"]
    }
    
    for indicator, keywords in keyword_map.items():
        for keyword in keywords:
            if keyword in normalized:
                return indicator, is_latest
    
    return None, is_latest

def fetch_static_table_data(indicator, year):
    """
    Mengambil data dari Static Table API BPS
    """
    if indicator not in SUBJECT_IDS:
        return None
    
    subject_id = SUBJECT_IDS[indicator]["id"]
    
    try:
        # Panggil API Static Table
        result = client.view_statictable(
            domain=DOMAIN_CODE,
            subject=subject_id,
            year=year,
            lang='ind'
        )
        
        if result is None:
            return None
        
        # Parse hasil
        data_tables = []
        
        if hasattr(result, 'data') and result.data:
            for table in result.data:
                table_info = {
                    'title': getattr(table, 'title', ''),
                    'type': getattr(table, 'type', ''),
                    'year': year,
                    'subject': SUBJECT_IDS[indicator]["indonesia"],
                    'data': []
                }
                
                # Ambil data dari tabel
                if hasattr(table, 'data'):
                    table_info['data'] = table.data
                elif hasattr(table, 'tabel'):
                    table_info['data'] = table.tabel
                
                data_tables.append(table_info)
        
        return data_tables
        
    except Exception as e:
        print(f"Error fetching static table for {indicator}: {e}", file=sys.stderr)
        return None

def fetch_publications(indicator, year):
    """
    Mengambil publikasi BPS yang relevan
    """
    try:
        result = client.list_publication(
            all=False,
            domain=[DOMAIN_CODE],
            year=year
        )
        
        if result is None:
            return []
        
        if hasattr(result, 'data'):
            publications = result.data
        elif isinstance(result, list):
            publications = result
        else:
            return []
        
        if not publications:
            return []
        
        relevant_pubs = []
        keywords = [indicator, SUBJECT_IDS[indicator]["indonesia"].lower()]
        
        for pub in publications[:5]:
            title = getattr(pub, 'title', '').lower()
            pub_id = getattr(pub, 'pub_id', '')
            
            is_relevant = False
            for keyword in keywords:
                if keyword in title:
                    is_relevant = True
                    break
            
            if is_relevant and pub_id:
                relevant_pubs.append({
                    'title': getattr(pub, 'title', ''),
                    'year': getattr(pub, 'year', year),
                    'release_date': getattr(pub, 'rl_date', ''),
                    'url': f"https://tanjabbarkab.bps.go.id/publication/{pub_id}"
                })
        
        return relevant_pubs[:3]
        
    except Exception as e:
        print(f"Error fetching publications: {e}", file=sys.stderr)
        return []

def extract_data_value(tables):
    """
    Ekstrak nilai numerik dari data tabel
    """
    if not tables:
        return None
    
    values = []
    for table in tables:
        if table.get('data'):
            data = table['data']
            # Coba ekstrak nilai numerik
            if isinstance(data, dict):
                for key, val in data.items():
                    if isinstance(val, (int, float)):
                        values.append(val)
                    elif isinstance(val, str):
                        numbers = re.findall(r'[\d,\.]+', val)
                        if numbers:
                            values.append(numbers[0])
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, (int, float)):
                        values.append(item)
                    elif isinstance(item, str):
                        numbers = re.findall(r'[\d,\.]+', item)
                        if numbers:
                            values.append(numbers[0])
    
    return values[0] if values else None

def format_response(tables, publications, query, year, indicator):
    """
    Format response dari data yang diperoleh
    """
    lines = [
        "DATA BPS KABUPATEN TANJUNG JABUNG BARAT",
        "=" * 40,
        "",
        f"Pertanyaan: {query}",
        f"Tahun: {year}",
        f"Sumber: Web API BPS - Static Table API",
        "",
    ]
    
    if tables:
        lines.append("📊 DATA STATISTIK:")
        lines.append("")
        for table in tables:
            lines.append(f"• {table.get('title', 'Data')}")
            lines.append(f"  Kategori: {table.get('subject', indicator.upper())}")
            
            # Tampilkan data
            if table.get('data'):
                data = table['data']
                if isinstance(data, dict):
                    for key, value in list(data.items())[:5]:
                        lines.append(f"  - {key}: {value}")
                elif isinstance(data, list):
                    for item in data[:5]:
                        lines.append(f"  - {item}")
            lines.append("")
    
    if publications:
        lines.append("📚 PUBLIKASI TERKAIT:")
        lines.append("")
        for pub in publications:
            lines.append(f"• {pub.get('title', '')}")
            lines.append(f"  Tanggal Rilis: {pub.get('release_date', '')}")
            lines.append(f"  🔗 {pub.get('url', '')}")
            lines.append("")
    
    if not tables and not publications:
        lines.extend([
            "⚠️ DATA TIDAK DITEMUKAN",
            "",
            f"Maaf, tidak ditemukan tabel statis atau publikasi tentang '{indicator}' untuk tahun {year}.",
            "",
            "📌 SARAN:",
            f"• Coba dengan kata kunci: {', '.join(SUBJECT_IDS.keys())}",
            "• Coba tahun yang berbeda (contoh: 2023, 2022, 2021)",
            "",
            "🔗 AKSES LANGSUNG:",
            f"• Website BPS: https://tanjabbarkab.bps.go.id",
            "• Layanan BPS: 082173054213",
            "• Email: bps1507@bps.go.id"
        ])
    
    lines.extend([
        "",
        "---",
        "📖 Data ini diambil langsung dari Web API BPS (Static Table API)",
        "✅ Data bersumber dari tabel statis resmi BPS"
    ])
    
    return "\n".join(lines)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        result = {
            "success": False,
            "message": "Silakan berikan pertanyaan. Contoh: 'Berapa jumlah penduduk Tanjung Jabung Barat tahun 2023?'",
            "sources": [{"uri": "https://tanjabbarkab.bps.go.id", "title": "BPS Tanjabbar"}]
        }
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)
    
    query = sys.argv[1]
    year = extract_year(query)
    indicator, is_latest = detect_indicator(query)
    
    print(f"Query: {query}", file=sys.stderr)
    print(f"Year: {year}, Indicator: {indicator}, Latest: {is_latest}", file=sys.stderr)
    
    result = {
        "success": False,
        "message": "",
        "sources": []
    }
    
    try:
        tables = []
        publications = []
        
        if indicator:
            # Ambil data dari Static Table API
            tables = fetch_static_table_data(indicator, year)
            
            # Jika data tidak ditemukan dan minta terbaru, coba tahun sebelumnya
            if (not tables or not any(t.get('data') for t in tables)) and is_latest:
                prev_year = str(int(year) - 1)
                print(f"Trying previous year: {prev_year}", file=sys.stderr)
                tables = fetch_static_table_data(indicator, prev_year)
                if tables and any(t.get('data') for t in tables):
                    year = prev_year
            
            # Ambil publikasi terkait
            publications = fetch_publications(indicator, year)
        
        # Format response
        if tables and any(t.get('data') for t in tables):
            result["success"] = True
            result["message"] = format_response(tables, publications, query, year, indicator)
            result["sources"] = [{
                "uri": "https://webapi.bps.go.id",
                "title": f"Web API BPS - Static Table: {indicator.upper()}"
            }]
        elif publications:
            result["success"] = True
            result["message"] = format_response([], publications, query, year, indicator)
            result["sources"] = [{
                "uri": "https://tanjabbarkab.bps.go.id",
                "title": "Publikasi BPS Tanjung Jabung Barat"
            }]
        else:
            result["success"] = False
            result["message"] = format_response([], [], query, year, indicator)
            result["sources"] = [{
                "uri": "https://tanjabbarkab.bps.go.id",
                "title": "Portal Resmi BPS Tanjung Jabung Barat"
            }]
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error: {error_msg}", file=sys.stderr)
        
        result["success"] = False
        result["message"] = f"""TERJADI KESALAHAN TEKNIS

Error: {error_msg}

Kemungkinan penyebab:
• Token API tidak valid
• Subject ID tidak ditemukan
• Koneksi ke server BPS terputus

Solusi:
• Verifikasi token di https://webapi.bps.go.id/developer/
• Coba lagi nanti
• Akses manual: https://tanjabbarkab.bps.go.id
• Hubungi BPS: 082173054213 / bps1507@bps.go.id"""
        
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()