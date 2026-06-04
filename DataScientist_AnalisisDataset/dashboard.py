"""
Analisis Sebaran dan Prediksi Kebutuhan SPPG Berbasis Machine Learning untuk Mendukung Program Makan Bergizi Gratis |
Badan Gizi Nasional 
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# ══════════════════════════════════════════════════════════════════
# PAGE CONFIG
# ══════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="Dashboard SPPG — Program MBG",
    page_icon="🍱",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ══════════════════════════════════════════════════════════════════
# THEME & STYLE
# ══════════════════════════════════════════════════════════════════
MBG_GREEN     = "#2D8B4E"   # Hijau MBG primer
MBG_GREEN_LT  = "#4CAF72"   # Hijau muda aksen
MBG_ORANGE    = "#E8861A"   # Oranye MBG
MBG_TEAL      = "#1A7F8E"   # Teal sekunder
MBG_RED       = "#D94F3D"   # Merah prioritas
MBG_YELLOW    = "#F2C14E"   # Kuning aksen
MBG_GRAY      = "#8A9BB0"   # Abu netral

PALETTE_KATEGORI = {
    "Layanan Sesuai (High Demand, High Supply)": MBG_GREEN,
    "Prioritas Utama (High Demand, Low Supply)": MBG_RED,
    "Layanan Cukup": MBG_GRAY,
}

color_map_label = {
            "Layanan Sesuai": MBG_GREEN,
            "Prioritas Utama": MBG_RED,
            "Layanan Cukup": MBG_GRAY,
}

st.markdown("""
<style>
/* ── Global font ── */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
}

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1B5E35 0%, #0E3D22 100%);
}
[data-testid="stSidebar"] * { color: #E8F5ED !important; }
[data-testid="stSidebar"] .stRadio label { color: #E8F5ED !important; }
[data-testid="stSidebar"] hr { border-color: #2D8B4E44; }

/* ── Metric cards ── */
[data-testid="metric-container"] {
    background: linear-gradient(135deg, #1B5E3508, #2D8B4E12);
    border: 1px solid #2D8B4E30;
    border-radius: 14px;
    padding: 16px 20px !important;
    box-shadow: 0 2px 8px #2D8B4E10;
    transition: box-shadow 0.2s;
}
[data-testid="metric-container"]:hover {
    box-shadow: 0 4px 20px #2D8B4E25;
}
[data-testid="stMetricLabel"] { font-weight: 600; font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase; color: #2D8B4E !important; }
[data-testid="stMetricValue"] { font-size: 1.85rem !important; font-weight: 800; }

/* ── Section headers ── */
.section-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #2D8B4E;
    border-left: 4px solid #E8861A;
    padding-left: 12px;
    margin: 24px 0 12px 0;
}

/* ── Info box ── */
.info-box {
    background: linear-gradient(135deg, #2D8B4E15, #1A7F8E10);
    border: 1px solid #2D8B4E35;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 0.88rem;
    line-height: 1.6;
    margin-bottom: 16px;
}

/* ── Tab ── */
[data-testid="stTabs"] button {
    font-weight: 600;
    font-size: 0.88rem;
}

/* ── Divider ── */
.mbg-divider {
    height: 3px;
    background: linear-gradient(90deg, #2D8B4E, #E8861A, #1A7F8E);
    border-radius: 99px;
    margin: 8px 0 24px 0;
}

/* ── Plotly chart border ── */
.stPlotlyChart {
    border-radius: 12px;
    overflow: hidden;
}

/* ── Scrollable table ── */
.dataframe-container {
    border-radius: 10px;
    overflow: hidden;
}
</style>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════
# DATA LOAD
# ══════════════════════════════════════════════════════════════════
@st.cache_data
def load_data():
    df = pd.read_csv("Dataset_Capstone_Final.csv")
    df["kode_provinsi_str"] = df["kode_provinsi"].astype(str)

    # Mapping kode provinsi → nama provinsi (berdasarkan data aktual)
    prov_map = {
        "10": "Jambi", "11": "Sumatera Selatan", "12": "Lampung",
        "13": "Kalimantan Barat", "14": "Kalimantan Tengah",
        "15": "Kalimantan Selatan", "16": "DKI Jakarta",
        "17": "Sulawesi Utara", "18": "Sulawesi Tengah",
        "19": "Sulawesi Selatan", "20": "Jawa Barat",
        "21": "Jawa Barat", "22": "Banten", "23": "Nusa Tenggara Barat",
        "24": "Nusa Tenggara Timur", "25": "Papua",
        "26": "Jawa Barat", "27": "Maluku Utara", "28": "Banten",
        "29": "Kep. Bangka Belitung", "30": "Jawa Tengah",
        "31": "Kep. Riau", "32": "Jawa Tengah",
        "33": "Sulawesi Barat", "34": "Kalimantan Utara",
        "36": "Jawa Tengah", "37": "Papua", "38": "Papua Pegunungan",
        "39": "Papua Barat", "40": "DI Yogyakarta",
        "46": "DI Yogyakarta", "50": "Jawa Timur", "51": "Jawa Timur",
        "52": "Jawa Timur", "56": "Jawa Timur",
        "60": "Aceh", "61": "Aceh", "62": "Aceh", "66": "Aceh",
        "70": "Sumatera Utara", "71": "Sumatera Utara",
        "72": "Sumatera Utara", "76": "Sumatera Utara",
        "80": "Sumatera Barat", "81": "Sumatera Barat",
        "86": "Sumatera Barat", "90": "Riau", "91": "Riau", "96": "Riau",
    }
    df["nama_provinsi"] = df["kode_provinsi_str"].map(prov_map).fillna("Lainnya")
    df["gap_sppg_positif"] = df["gap_sppg"].clip(lower=0)
    df["label_kategori"] = df["kategori_layanan"].map({
        "Layanan Sesuai (High Demand, High Supply)": "Layanan Sesuai",
        "Prioritas Utama (High Demand, Low Supply)": "Prioritas Utama",
        "Layanan Cukup": "Layanan Cukup",
    })
    return df

df = load_data()

# ══════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown("""
    <div style="text-align:center; padding: 8px 0 16px 0;">
        <div style="font-size:2.4rem;">🍱</div>
        <div style="font-size:1.1rem; font-weight:800; letter-spacing:0.02em;">Dashboard SPPG</div>
        <div style="font-size:0.78rem; opacity:0.75; margin-top:2px;">Program Makan Bergizi Gratis</div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown('<hr style="margin:0 0 16px 0"/>', unsafe_allow_html=True)

    menu = st.radio(
        "**Navigasi**",
        options=[
            "📊 Ringkasan Nasional",
            "🔍 Analisis Distribusi",
            "🎯 Wilayah Prioritas",
            "📈 Korelasi & Tren",
            "🗂️ Data & Dictionary",
        ],
    )

    st.markdown('<hr style="margin:16px 0"/>', unsafe_allow_html=True)

    # Filter Global
    st.markdown("**⚙️ Filter Global**")

    all_prov = sorted(df["nama_provinsi"].unique())
    selected_prov = st.multiselect(
        "Provinsi",
        options=all_prov,
        default=[],
        placeholder="Semua provinsi",
    )

    all_kat = df["label_kategori"].unique().tolist()
    selected_kat = st.multiselect(
        "Kategori Layanan",
        options=all_kat,
        default=[],
        placeholder="Semua kategori",
    )

    st.markdown('<hr style="margin:16px 0"/>', unsafe_allow_html=True)
    st.markdown("""
    <div style="font-size:0.72rem; opacity:0.65; line-height:1.7;">
        <b>Sumber data:</b><br>
        Peserta Didik Kemendikbud &<br>
        SPPG Operasional BGN<br><br>
        <b>Benchmark:</b><br>
        1 SPPG = 3.000 siswa (avg)<br>
        Maks. 4.000 siswa/SPPG<br>
        (Perpres 83/2024 & Juknis BGN)
    </div>
    """, unsafe_allow_html=True)

# Apply filter
df_filtered = df.copy()
if selected_prov:
    df_filtered = df_filtered[df_filtered["nama_provinsi"].isin(selected_prov)]
if selected_kat:
    df_filtered = df_filtered[df_filtered["label_kategori"].isin(selected_kat)]

# ══════════════════════════════════════════════════════════════════
# HELPER: PLOTLY THEME
# ══════════════════════════════════════════════════════════════════
CHART_LAYOUT = dict(
    font_family="Plus Jakarta Sans",
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    legend=dict(
        bgcolor="rgba(255,255,255,0.05)",
        bordercolor="rgba(128,128,128,0.2)",
        borderwidth=1,
        font_size=12,
    ),
    xaxis=dict(gridcolor="rgba(128,128,128,0.12)", zerolinecolor="rgba(128,128,128,0.2)"),
    yaxis=dict(gridcolor="rgba(128,128,128,0.12)", zerolinecolor="rgba(128,128,128,0.2)"),
)

# def styled_fig(fig, height=420):
#     fig.update_layout(**CHART_LAYOUT, height=height)
#     return fig

def section(title):
    st.markdown(f'<div class="section-title">{title}</div>', unsafe_allow_html=True)
    st.markdown('<div class="mbg-divider"></div>', unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════
# PAGE 1: RINGKASAN NASIONAL
# ══════════════════════════════════════════════════════════════════
if menu == "📊 Ringkasan Nasional":

    st.markdown("""
    <div style="margin-bottom:4px;">
        <span style="font-size:1.7rem; font-weight:800;">📊 Ringkasan Nasional</span>
        <span style="font-size:0.88rem; color:#2D8B4E; font-weight:600; margin-left:12px;">SPPG & Peserta Didik</span>
    </div>
    """, unsafe_allow_html=True)
    st.markdown('<div class="mbg-divider"></div>', unsafe_allow_html=True)
    st.markdown(f'<div class="info-box">📌 Menampilkan <b>{len(df_filtered):,}</b> dari <b>{len(df):,}</b> kabupaten/kota. Gunakan filter di sidebar untuk mempersempit data.</div>', unsafe_allow_html=True)

    # ── KPI Cards ───────────────────────────────────────────────
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("🏙️ Kab/Kota", f"{len(df_filtered):,}")
    c2.metric("👩‍🎓 Total Siswa", f"{df_filtered['total_siswa'].sum()/1e6:.2f}Jt")
    c3.metric("🍱 Total SPPG", f"{int(df_filtered['jumlah_sppg'].sum()):,}")
    c4.metric("🚨 Tanpa SPPG", f"{int(df_filtered['flag_tanpa_sppg'].sum()):,}")
    c5.metric("📉 Rata-rata Gap", f"{df_filtered['gap_sppg'].mean():+.1f}")

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Row 1: Pie + Bar Provinsi ────────────────────────────────
    col_l, col_r = st.columns([1, 1.6])

    with col_l:
        section("Kategori Layanan Wilayah")
        kat_count = df_filtered["label_kategori"].value_counts().reset_index()
        kat_count.columns = ["Kategori", "Jumlah"]
    
        fig_pie = px.pie(
            kat_count, values="Jumlah", names="Kategori",
            color="Kategori", color_discrete_map=color_map_label,
            hole=0.6,
        )
        
        fig_pie.update_traces(
            textinfo="percent",
            textposition="inside", 
            pull=[0.03, 0.08, 0],
            marker=dict(line=dict(color="rgba(0,0,0,0.08)", width=1.5)),
        )
        fig_pie.update_layout(
            legend=dict(
                orientation="h",
                y=-0.15,
                x=0.5,
                xanchor="center"
            ),
            height=380,
        )
        st.plotly_chart(fig_pie, use_container_width=True, config={"displayModeBar": False})

    with col_r:
        section("Top 10 Provinsi — Jumlah SPPG")
        prov_agg = (
            df_filtered.groupby("nama_provinsi")
            .agg(jumlah_sppg=("jumlah_sppg", "sum"), total_siswa=("total_siswa", "sum"))
            .reset_index()
            .sort_values("jumlah_sppg", ascending=True)
            .tail(10)
        )
        fig_prov = go.Figure(go.Bar(
            x=prov_agg["jumlah_sppg"],
            y=prov_agg["nama_provinsi"],
            orientation="h",
            marker=dict(
                color=prov_agg["jumlah_sppg"],
                colorscale=[[0, "#B7E4C7"],[1, MBG_GREEN]],
                line=dict(width=0),
            ),
            text=prov_agg["jumlah_sppg"].apply(lambda x: f"{int(x):,}"),
            textposition="auto",
            hovertemplate="<b>%{y}</b><br>SPPG: %{x:,}<extra></extra>",
        ))
        fig_prov.update_traces(
            textfont_size=12
        )
        fig_prov.update_layout(**CHART_LAYOUT, height=340, xaxis_title="Jumlah SPPG", 
                               yaxis_title="",)
        st.plotly_chart(fig_prov, use_container_width=True, config={"displayModeBar": False})

    # ── Row 2: Jenjang treemap + SPPG distribution ──────────────
    col_a, col_b = st.columns(2)

    with col_a:
        section("Proporsi Siswa per Jenjang (Nasional)")
        jenjang_data = {
            "Jenjang": ["SD/Sederajat", "SMP/Sederajat", "SMA/Sederajat", "SMK/Sederajat"],
            "Jumlah": [
                df_filtered["sd_sederajat"].sum(),
                df_filtered["smp_sederajat"].sum(),
                df_filtered["sma_sederajat"].sum(),
                df_filtered["smk_sederajat"].sum(),
            ]
        }
        jdf = pd.DataFrame(jenjang_data)
        jdf["Persen"] = (jdf["Jumlah"] / jdf["Jumlah"].sum() * 100).round(1)
        fig_jenjang = px.bar(
            jdf, x="Jenjang", y="Jumlah",
            color="Jenjang",
            color_discrete_sequence=[MBG_GREEN, MBG_TEAL, MBG_ORANGE, MBG_YELLOW],
            text=jdf["Persen"].apply(lambda x: f"{x}%"),
        )
        fig_jenjang.update_traces(textposition="outside", marker_line_width=0)
        fig_jenjang.update_layout(
            **CHART_LAYOUT, height=320,
            showlegend=False, yaxis_title="Jumlah Siswa",
            xaxis_title="",
        )
        fig_jenjang.update_yaxes(tickformat=".2s")
        st.plotly_chart(fig_jenjang, use_container_width=True, config={"displayModeBar": False})

    with col_b:
        section("Distribusi Gap SPPG per Kategori")
        fig_box = px.box(
            df_filtered, x="label_kategori", y="gap_sppg",
            color="label_kategori",
            color_discrete_map=color_map_label,
            points="outliers",
            labels={"label_kategori": "Kategori", "gap_sppg": "Gap SPPG"},
        )
        fig_box.update_traces(marker_size=4, line_width=1.5)
        fig_box.add_hline(y=0, line_dash="dot", line_color=MBG_ORANGE,
                          annotation_text="Gap = 0", annotation_position="top right")
        fig_box.update_layout(**CHART_LAYOUT, height=320, showlegend=False, xaxis_title="")
        st.plotly_chart(fig_box, use_container_width=True, config={"displayModeBar": False})


# ══════════════════════════════════════════════════════════════════
# PAGE 2: ANALISIS DISTRIBUSI
# ══════════════════════════════════════════════════════════════════
elif menu == "🔍 Analisis Distribusi":

    st.markdown('<span style="font-size:1.7rem; font-weight:800;">🔍 Analisis Distribusi SPPG</span>', unsafe_allow_html=True)
    st.markdown('<div class="mbg-divider"></div>', unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs(["📊 Rasio Siswa/SPPG", "🗺️ Kuadran Layanan", "📉 Histogram & Box"])

    with tab1:
        section("Top 10 Wilayah — Rasio Siswa per SPPG Tertinggi")
        st.markdown('<div class="info-box">Benchmark: 1 SPPG melayani rata-rata <b>3.000</b>  (Juknis BGN, Agustus 2025). </div>', unsafe_allow_html=True)

        top10 = (
            df_filtered[df_filtered["jumlah_sppg"] > 0]
            .sort_values("rasio_siswa_per_sppg", ascending=False)
            .head(10)
        )

        # Color gradient based on value
        max_rasio = top10["rasio_siswa_per_sppg"].max()
        colors_bar = [
            MBG_RED if r > 4000 else (MBG_ORANGE if r > 3000 else MBG_GREEN)
            for r in top10["rasio_siswa_per_sppg"]
        ]

        fig_rasio = go.Figure()
        fig_rasio.add_trace(go.Bar(
            x=top10["rasio_siswa_per_sppg"],
            y=top10["nama_kabupaten"],
            orientation="h",
            marker=dict(color=colors_bar, line=dict(width=0)),
            text=top10["rasio_siswa_per_sppg"].apply(lambda x: f"{x:,.0f}"),
            textposition="outside",
            hovertemplate="<b>%{y}</b><br>Rasio: %{x:,.0f} siswa/SPPG<extra></extra>",
        ))
        # Benchmark lines
        fig_rasio.add_vline(x=3000, line_dash="dash", line_color=MBG_GREEN,
                            annotation_text="Ideal (3.000)", annotation_position="top")
        fig_rasio.add_vline(x=4000, line_dash="dot", line_color=MBG_ORANGE,
                            annotation_text="Maks (4.000)", annotation_position="top")
        fig_rasio.update_layout(
            **CHART_LAYOUT, height=440,
            xaxis_title="Rasio Siswa per SPPG", yaxis_title="",
        )
        fig_rasio.update_yaxes(
            autorange="reversed",
            gridcolor="rgba(128,128,128,0.12)"
        )
        fig_rasio.update_xaxes(
            tickformat=",",
            gridcolor="rgba(128,128,128,0.12)"
        )
        st.plotly_chart(fig_rasio, use_container_width=True)

        col1, col2, col3 = st.columns(3)
        col1.metric("🔴 Di atas 4.000 (Melampaui kapasitas)",
                    f"{len(df_filtered[df_filtered['rasio_siswa_per_sppg'] > 4000]):,} wilayah")
        col2.metric("🟠 3.000–4.000 (Mendekati kapasitas)",
                    f"{len(df_filtered[(df_filtered['rasio_siswa_per_sppg'] > 3000) & (df_filtered['rasio_siswa_per_sppg'] <= 4000)]):,} wilayah")
        col3.metric("🟢 Di bawah 3.000 (Di bawah ideal)",
                    f"{len(df_filtered[df_filtered['rasio_siswa_per_sppg'] <= 3000]):,} wilayah")

    with tab2:
        section("Peta Kuadran — Demand vs Supply SPPG")
        st.markdown('<div class="info-box">Sumbu X: jumlah siswa (demand). Sumbu Y: jumlah SPPG (supply). Garis putus-putus = rata-rata nasional. Wilayah <b style="color:#D94F3D">merah</b> = High Demand, Low Supply → <b>Prioritas utama penambahan SPPG.</b></div>', unsafe_allow_html=True)

        mean_siswa = df["total_siswa"].mean()
        mean_sppg  = df["jumlah_sppg"].mean()

        plot_df = df_filtered.copy()
        plot_df["rasio_siswa_per_sppg"] = (
            plot_df["rasio_siswa_per_sppg"]
            .fillna(0)
        )
        fig_quad = px.scatter(
            plot_df,
            x="total_siswa",
            y="jumlah_sppg",
            color="label_kategori",
            color_discrete_map=color_map_label,
            size="rasio_siswa_per_sppg",
            size_max=28,
            hover_name="nama_kabupaten",
            hover_data={
                "total_siswa": ":,.0f",
                "jumlah_sppg": ":,.0f",
                "rasio_siswa_per_sppg": ":,.0f",
                "gap_sppg": ":+.1f",
                "label_kategori": False,
            },
            labels={
                "total_siswa": "Total Siswa (Demand)",
                "jumlah_sppg": "Jumlah SPPG (Supply)",
                "label_kategori": "Status Layanan",
                "rasio_siswa_per_sppg": "Rasio Siswa/SPPG",
                "gap_sppg": "Gap SPPG",
            },
            opacity=0.80,
        )
        fig_quad.add_vline(x=mean_siswa, line_dash="dash", line_color=MBG_TEAL,
                           annotation_text=f"Rata-rata Siswa<br>({mean_siswa:,.0f})",
                           annotation_position="top right", annotation_font_size=11)
        fig_quad.add_hline(y=mean_sppg, line_dash="dash", line_color=MBG_ORANGE,
                           annotation_text=f"Rata-rata SPPG ({mean_sppg:.1f})",
                           annotation_position="bottom right", annotation_font_size=11)
        fig_quad.update_xaxes(tickformat=".2s")
        fig_quad.update_layout(**CHART_LAYOUT, height=520, legend_title="Status Layanan")
        st.plotly_chart(fig_quad, use_container_width=True)

    with tab3:
        col_l, col_r = st.columns(2)
        with col_l:
            section("Distribusi Rasio Siswa per SPPG")
            rasio_clean = df_filtered["rasio_siswa_per_sppg"].dropna()
            fig_hist = go.Figure()
            fig_hist.add_trace(go.Histogram(
                x=rasio_clean, nbinsx=35,
                marker=dict(
                    color="rgba(45,139,78,0.65)",
                    line=dict(color=MBG_GREEN, width=0.5),
                ),
                name="Wilayah",
                hovertemplate="Rasio: %{x:,.0f}<br>Jumlah: %{y}<extra></extra>",
            ))
            fig_hist.add_vline(x=3000, line_dash="dash", line_color=MBG_GREEN,
                               annotation_text="Ideal 3K", annotation_position="top")
            fig_hist.add_vline(x=4000, line_dash="dot", line_color=MBG_ORANGE,
                               annotation_text="Maks 4K", annotation_position="top")
            fig_hist.add_vline(x=rasio_clean.median(), line_dash="solid",
                               line_color=MBG_TEAL, line_width=2,
                               annotation_text=f"Median {rasio_clean.median():,.0f}",
                               annotation_position="top left")
            fig_hist.update_layout(
                **CHART_LAYOUT, height=380, showlegend=False,
                xaxis_title="Rasio Siswa/SPPG", yaxis_title="Jumlah Wilayah",
            )
            st.plotly_chart(fig_hist, use_container_width=True)

        with col_r:
            section("Distribusi SPPG vs Total Siswa")
            fig_scatter2 = px.scatter(
                df_filtered, x="jumlah_sppg", y="total_siswa",
                trendline="ols",
                hover_name="nama_kabupaten",
                color_discrete_sequence=[MBG_TEAL],
                labels={"jumlah_sppg": "Jumlah SPPG", "total_siswa": "Total Siswa"},
                opacity=0.65,
            )
            fig_scatter2.update_traces(marker_size=6)
            if len(fig_scatter2.data) > 1:
                fig_scatter2.data[1].line.color = MBG_ORANGE  # trendline
            fig_scatter2.update_yaxes(tickformat=".2s")
            fig_scatter2.update_layout(**CHART_LAYOUT, height=380)
            st.plotly_chart(fig_scatter2, use_container_width=True)


# ══════════════════════════════════════════════════════════════════
# PAGE 3: WILAYAH PRIORITAS
# ══════════════════════════════════════════════════════════════════
elif menu == "🎯 Wilayah Prioritas":

    st.markdown('<span style="font-size:1.7rem; font-weight:800;">🎯 Wilayah Prioritas Penambahan SPPG</span>', unsafe_allow_html=True)
    st.markdown('<div class="mbg-divider"></div>', unsafe_allow_html=True)

    tab_a, tab_b, tab_c = st.tabs(["🔴 Prioritas Utama", "📊 Top Gap SPPG", "⚠️ Tanpa SPPG"])

    with tab_a:
        section("Wilayah Prioritas Utama (High Demand, Low Supply)")
        st.markdown('<div class="info-box">Wilayah dengan jumlah siswa <b>di atas rata-rata nasional</b> namun jumlah SPPG <b>di bawah rata-rata</b>. Ini adalah kondisi paling kritis yang memerlukan intervensi segera.</div>', unsafe_allow_html=True)

        prioritas = df_filtered[
            df_filtered["kategori_layanan"] == "Prioritas Utama (High Demand, Low Supply)"
        ].sort_values("gap_sppg", ascending=False)

        if len(prioritas) == 0:
            st.info("Tidak ada wilayah Prioritas Utama dalam filter yang dipilih.")
        else:
            n = st.slider("Tampilkan top N wilayah:", 5, min(30, len(prioritas)), min(10, len(prioritas)), key="sl_prior")
            df_plot = prioritas.head(n).sort_values("gap_sppg")

            fig_prior = go.Figure()
            fig_prior.add_trace(go.Bar(
                x=df_plot["gap_sppg"],
                y=df_plot["nama_kabupaten"],
                orientation="h",
                marker=dict(
                    color=df_plot["gap_sppg"],
                    colorscale=[[0, MBG_ORANGE], [1, MBG_RED]],
                    line=dict(width=0),
                    showscale=True,
                    colorbar=dict(title="Gap SPPG", thickness=12),
                ),
                text=df_plot["gap_sppg"].apply(lambda x: f"+{x:.1f}"),
                textposition="outside",
                customdata=df_plot[["total_siswa", "jumlah_sppg", "rasio_siswa_per_sppg"]].values,
                hovertemplate=(
                    "<b>%{y}</b><br>"
                    "Gap: +%{x:.1f} SPPG<br>"
                    "Total Siswa: %{customdata[0]:,.0f}<br>"
                    "SPPG Ada: %{customdata[1]:.0f}<br>"
                    "Rasio: %{customdata[2]:,.0f} siswa/SPPG<extra></extra>"
                ),
            ))
            fig_prior.update_layout(
                **CHART_LAYOUT,
                height=max(380, n * 38),
                xaxis_title="Kekurangan SPPG (Gap)",
                yaxis_title="",
                title=f"Top {n} Wilayah Prioritas Utama — Gap SPPG Terbesar",
            )
            st.plotly_chart(fig_prior, use_container_width=True)

            st.markdown("**Detail Data Prioritas Utama**")
            st.dataframe(
                prioritas[["nama_kabupaten", "nama_provinsi", "total_siswa",
                            "jumlah_sppg", "kebutuhan_sppg", "gap_sppg",
                            "rasio_siswa_per_sppg"]]
                .rename(columns={
                    "nama_kabupaten": "Kabupaten/Kota",
                    "nama_provinsi": "Provinsi",
                    "total_siswa": "Total Siswa",
                    "jumlah_sppg": "SPPG Ada",
                    "kebutuhan_sppg": "Kebutuhan SPPG",
                    "gap_sppg": "Gap SPPG",
                    "rasio_siswa_per_sppg": "Rasio Siswa/SPPG",
                })
                .style.format({
                    "Total Siswa": "{:,.0f}",
                    "SPPG Ada": "{:.0f}",
                    "Kebutuhan SPPG": "{:.1f}",
                    "Gap SPPG": "{:+.1f}",
                    "Rasio Siswa/SPPG": "{:,.0f}",
                })
                .background_gradient(subset=["Gap SPPG"], cmap="Reds"),
                use_container_width=True,
                height=360,
            )

    with tab_b:
        section("Top Wilayah — Gap SPPG Terbesar (Semua Kategori)")
        n2 = st.slider("Tampilkan top N:", 5, 30, 10, key="sl_gap")
        top_gap_all = (
            df_filtered[df_filtered["gap_sppg"] > 0]
            .sort_values("gap_sppg", ascending=False)
            .head(n2)
            .sort_values("gap_sppg")
        )

        fig_gap = go.Figure()
        cat_colors = {
            "Prioritas Utama": MBG_RED,
            "Layanan Sesuai": MBG_TEAL,
            "Layanan Cukup": MBG_GRAY,
        }
        for kat in top_gap_all["label_kategori"].unique():
            sub = top_gap_all[top_gap_all["label_kategori"] == kat]
            fig_gap.add_trace(go.Bar(
                x=sub["gap_sppg"],
                y=sub["nama_kabupaten"],
                orientation="h",
                name=kat,
                marker=dict(color=cat_colors.get(kat, MBG_GRAY), line=dict(width=0)),
                text=sub["gap_sppg"].apply(lambda x: f"{x:.1f}"),
                textposition="outside",
                hovertemplate="<b>%{y}</b><br>Gap: %{x:.1f}<extra></extra>",
            ))
        fig_gap.update_layout(
            **CHART_LAYOUT,
            height=max(380, n2 * 36),
            barmode="stack",
            xaxis_title="Gap SPPG (kebutuhan − ketersediaan)",
            yaxis_title="",
            legend_title="Kategori",
            title=f"Top {n2} Wilayah Kekurangan SPPG — Benchmark 3.000 Siswa/SPPG",
        )
        st.plotly_chart(fig_gap, use_container_width=True)

    with tab_c:
        section("Wilayah Tanpa SPPG Sama Sekali")
        st.markdown('<div class="info-box">⚠️ Wilayah ini <b>belum memiliki satupun SPPG operasional</b>. Seluruh peserta didiknya tidak mendapat layanan MBG. Ini adalah kondisi paling mendesak.</div>', unsafe_allow_html=True)

        tanpa_sppg = df_filtered[df_filtered["flag_tanpa_sppg"] == 1].sort_values("total_siswa", ascending=False)

        if len(tanpa_sppg) == 0:
            st.success("✅ Tidak ada wilayah tanpa SPPG dalam filter yang dipilih.")
        else:
            c1, c2 = st.columns([1, 2])
            with c1:
                st.metric("Jumlah Wilayah", len(tanpa_sppg))
                st.metric("Total Siswa Tidak Terlayani", f"{tanpa_sppg['total_siswa'].sum():,.0f}")
                st.metric("Kebutuhan SPPG Estimasi", f"{tanpa_sppg['kebutuhan_sppg'].sum():,.0f}")
            with c2:
                fig_tanpa = px.bar(
                    tanpa_sppg.sort_values("total_siswa").tail(15),
                    x="total_siswa", y="nama_kabupaten",
                    orientation="h",
                    color="total_siswa",
                    color_continuous_scale=[[0, "rgba(232,134,26,0.4)"], [1, MBG_RED]],
                    labels={"total_siswa": "Total Siswa", "nama_kabupaten": ""},
                    text="total_siswa",
                )
                fig_tanpa.update_traces(
                    texttemplate="%{text:,.0f}", textposition="outside",
                    marker_line_width=0,
                )
                fig_tanpa.update_layout(**CHART_LAYOUT, height=380, showlegend=False,
                                        coloraxis_showscale=False)
                fig_tanpa.update_xaxes(tickformat=".2s")
                st.plotly_chart(fig_tanpa, use_container_width=True)

            st.dataframe(
                tanpa_sppg[["nama_kabupaten", "nama_provinsi", "total_siswa", "kebutuhan_sppg"]]
                .rename(columns={
                    "nama_kabupaten": "Kabupaten/Kota",
                    "nama_provinsi": "Provinsi",
                    "total_siswa": "Total Siswa",
                    "kebutuhan_sppg": "Kebutuhan SPPG (Estimasi)",
                })
                .style.format({"Total Siswa": "{:,.0f}", "Kebutuhan SPPG (Estimasi)": "{:.0f}"}),
                use_container_width=True,
            )


# ══════════════════════════════════════════════════════════════════
# PAGE 4: KORELASI & TREN
# ══════════════════════════════════════════════════════════════════
elif menu == "📈 Korelasi & Tren":

    st.markdown('<span style="font-size:1.7rem; font-weight:800;">📈 Korelasi & Tren</span>', unsafe_allow_html=True)
    st.markdown('<div class="mbg-divider"></div>', unsafe_allow_html=True)

    # ── Heatmap Korelasi ────────────────────────────────────────
    section("Matriks Korelasi Variabel Numerik")
    num_cols = ["sd_sederajat", "smp_sederajat", "sma_sederajat", "smk_sederajat",
                "total_siswa", "jumlah_sppg", "rasio_siswa_per_sppg",
                "kebutuhan_sppg", "gap_sppg"]
    corr = df_filtered[num_cols].corr().round(3)
    labels = ["SD", "SMP", "SMA", "SMK", "Total Siswa", "Jml SPPG",
              "Rasio/SPPG", "Kebutuhan", "Gap"]

    fig_heat = go.Figure(go.Heatmap(
        z=corr.values,
        x=labels, y=labels,
        colorscale="RdYlGn",
        zmin=-1, zmax=1,
        text=corr.values,
        # texttemplate="%{text:.2f}",
        # textfont_size=11,
        hoverongaps=False,
    ))
    fig_heat.update_layout(
        **{k: v for k, v in CHART_LAYOUT.items() if k not in ["xaxis", "yaxis"]},
        height=460,
        xaxis=dict(side="bottom"),
    )
    st.plotly_chart(fig_heat, use_container_width=True)

    # ── SMA & SMK vs SPPG ───────────────────────────────────────
    col1, col2 = st.columns(2)
    for col, var, label in [
        (col1, "sma_sederajat", "Siswa SMA"),
        (col2, "smk_sederajat", "Siswa SMK"),
    ]:
        with col:
            section(f"SPPG vs {label}")
            corr_val = df_filtered[[var, "jumlah_sppg"]].corr().iloc[0, 1]
            fig_s = px.scatter(
                df_filtered, x=var, y="jumlah_sppg",
                trendline="ols",
                color="label_kategori",
                color_discrete_map=color_map_label,
                hover_name="nama_kabupaten",
                labels={var: label, "jumlah_sppg": "Jumlah SPPG", "label_kategori": "Kategori"},
                opacity=0.7,
            )
            if len(fig_s.data) > 1:
                fig_s.data[-1].line.color = MBG_ORANGE
                fig_s.data[-1].line.width = 2.5
            fig_s.update_traces(marker_size=7, selector=dict(mode="markers"))
            fig_s.update_xaxes(tickformat=".2s")
            fig_s.update_layout(
                **CHART_LAYOUT, height=360,
                showlegend=False,
                title=f"r = {corr_val:.3f}",
                title_font_size=13,
                title_font_color=MBG_TEAL,
            )
            st.plotly_chart(fig_s, use_container_width=True)

    # ── Jenjang per 5 wilayah SPPG terbanyak ────────────────────
    section("Proporsi Jenjang pada Wilayah dengan SPPG Terbanyak")
    top5 = df_filtered.sort_values("jumlah_sppg", ascending=False).head(5)
    df_jenjang = top5.melt(
        id_vars="nama_kabupaten",
        value_vars=["sd_sederajat", "smp_sederajat", "sma_sederajat", "smk_sederajat"],
        var_name="Jenjang", value_name="Jumlah",
    )
    df_jenjang["Jenjang"] = df_jenjang["Jenjang"].map({
        "sd_sederajat": "SD", "smp_sederajat": "SMP",
        "sma_sederajat": "SMA", "smk_sederajat": "SMK",
    })
    fig_jenjang5 = px.bar(
        df_jenjang, x="nama_kabupaten", y="Jumlah", color="Jenjang",
        color_discrete_sequence=[MBG_GREEN, MBG_TEAL, MBG_ORANGE, MBG_YELLOW],
        barmode="stack",
        labels={"nama_kabupaten": "", "Jumlah": "Jumlah Siswa"},
        text_auto=False,
    )
    fig_jenjang5.update_yaxes(tickformat=".2s")
    fig_jenjang5.update_layout(**CHART_LAYOUT, height=360)
    st.plotly_chart(fig_jenjang5, use_container_width=True)


# ══════════════════════════════════════════════════════════════════
# PAGE 5: DATA & DICTIONARY
# ══════════════════════════════════════════════════════════════════
elif menu == "🗂️ Data & Dictionary":

    st.markdown('<span style="font-size:1.7rem; font-weight:800;">🗂️ Data & Dictionary</span>', unsafe_allow_html=True)
    st.markdown('<div class="mbg-divider"></div>', unsafe_allow_html=True)

    tab_d1, tab_d2 = st.tabs(["📋 Data Dictionary", "🔎 Eksplorasi Data"])

    with tab_d1:
        section("Kamus Data — Dataset Final SPPG")
        st.markdown('<div class="info-box">Dataset ini merupakan hasil penggabungan data Peserta Didik per Kabupaten/Kota dengan data SPPG Operasional BGN, melalui proses Data Wrangling dan Feature Engineering.</div>', unsafe_allow_html=True)

        dd = pd.DataFrame({
            "Kolom": [
                "kode_wilayah", "kode_provinsi", "kode_kabupaten",
                "nama_kabupaten", "sd_sederajat", "smp_sederajat",
                "sma_sederajat", "smk_sederajat", "total_siswa",
                "jumlah_sppg", "flag_tanpa_sppg", "rasio_siswa_per_sppg",
                "kebutuhan_sppg", "gap_sppg", "kategori_layanan",
            ],
            "Tipe": [
                "int", "int", "int", "str", "int", "int", "int", "int",
                "int", "float", "int", "float", "float", "float", "str",
            ],
            "Deskripsi": [
                "Kode BPS wilayah kabupaten/kota — identifier unik",
                "Kode provinsi (2 digit pertama dari kode_wilayah)",
                "Kode kabupaten (4 digit pertama dari kode_wilayah)",
                "Nama kabupaten/kota yang telah distandarisasi",
                "Jumlah peserta didik jenjang SD/sederajat",
                "Jumlah peserta didik jenjang SMP/sederajat",
                "Jumlah peserta didik jenjang SMA/sederajat",
                "Jumlah peserta didik jenjang SMK/sederajat",
                "Total seluruh peserta didik (SD+SMP+SMA+SMK)",
                "Jumlah titik SPPG operasional (0 = belum ada)",
                "Flag: 1 = belum memiliki SPPG, 0 = sudah ada",
                "Rasio total_siswa / jumlah_sppg (NaN jika 0 SPPG)",
                "Estimasi kebutuhan SPPG = total_siswa / 3.000",
                "Gap = kebutuhan_sppg − jumlah_sppg (positif = kekurangan)",
                "Segmentasi: Prioritas Utama / Layanan Sesuai / Layanan Cukup",
            ],
            "Catatan Model": [
                "Jangan gunakan sebagai fitur numerik",
                "Bisa sebagai fitur kategorik regional",
                "Bisa sebagai fitur kategorik",
                "Key join; encode sebelum modeling",
                "Fitur numerik ✓", "Fitur numerik ✓",
                "Fitur numerik ✓", "Fitur numerik ✓",
                "Target demand utama",
                "Target supply utama",
                "Fitur biner ✓ aman",
                "NaN = wilayah tanpa SPPG → imputasi dulu",
                "Derived feature — aman jika bukan target",
                "Derived feature — positif = kekurangan",
                "Label klasifikasi — encode sebelum model",
            ],
        })
        st.dataframe(dd, use_container_width=True, height=480)

        st.markdown('<br>', unsafe_allow_html=True)
        section("Statistik Deskriptif Dataset Final")
        num_only = df[[
            "total_siswa", "jumlah_sppg", "rasio_siswa_per_sppg",
            "kebutuhan_sppg", "gap_sppg",
            "sd_sederajat", "smp_sederajat", "sma_sederajat", "smk_sederajat"
        ]].describe().T
        num_only.columns = ["N", "Mean", "Std", "Min", "Q1", "Median", "Q3", "Max"]
        st.dataframe(
            num_only.style.format("{:,.2f}").background_gradient(subset=["Mean"], cmap="Greens"),
            use_container_width=True,
        )

    with tab_d2:
        section("Eksplorasi Data Interaktif")
        search = st.text_input("🔍 Cari Kabupaten/Kota:", placeholder="Contoh: SURABAYA, BOGOR...")
        show_cols = st.multiselect(
            "Tampilkan kolom:",
            options=df.columns.tolist(),
            default=["nama_kabupaten", "nama_provinsi", "total_siswa",
                     "jumlah_sppg", "rasio_siswa_per_sppg", "gap_sppg", "kategori_layanan"],
        )
        sort_by = st.selectbox("Urutkan berdasarkan:",
                               options=["total_siswa", "jumlah_sppg", "gap_sppg",
                                        "rasio_siswa_per_sppg", "nama_kabupaten"],
                               index=2)
        ascending = st.checkbox("Urutan Naik (Ascending)", value=False)

        df_display = df_filtered.copy()
        if search:
            df_display = df_display[df_display["nama_kabupaten"].str.contains(
                search, case=False, na=False
            )]
        df_display = df_display.sort_values(sort_by, ascending=ascending)

        st.markdown(f"Menampilkan **{len(df_display):,}** baris")
        if show_cols:
            st.dataframe(df_display[show_cols], use_container_width=True, height=480)
        else:
            st.warning("Pilih minimal satu kolom.")

        # Download
        csv_export = df_display.to_csv(index=False).encode("utf-8")
        st.download_button(
            "⬇️ Download Data (CSV)",
            data=csv_export,
            file_name="SPPG_filtered.csv",
            mime="text/csv",
        )


# ══════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════
st.markdown("""
<div style="margin-top:48px; padding:16px 0 8px 0; border-top:1px solid #2D8B4E30;
     text-align:center; font-size:0.78rem; opacity:0.55; line-height:1.8;">
    🍱 Dashboard SPPG — Program Makan Bergizi Gratis &nbsp;|&nbsp;
    Badan Gizi Nasional &nbsp;|&nbsp;
    Benchmark: 1 SPPG = 3.000 siswa (Perpres 83/2024 &amp; Juknis BGN Agustus 2025)
</div>
""", unsafe_allow_html=True)
