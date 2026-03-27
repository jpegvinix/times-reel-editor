#!/usr/bin/env python3
"""
Baixa os escudos dos 39 times (Série A e B 2026) do Wikimedia Commons
e salva como PNG 240×240 com fundo transparente.

Uso:
    python3 baixar_escudos.py

Requisitos:
    pip install requests Pillow
"""

import requests
from pathlib import Path
from PIL import Image
from io import BytesIO
import time
import sys

# ── Destino ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "escudos"
OUTPUT_DIR.mkdir(exist_ok=True)

HEADERS = {"User-Agent": "EscudosBR/1.0 (personal project)"}

# ── Mapa completo: arquivo → URL do Wikimedia ────────────────────────────────
ESCUDOS = {
    # ── Série A ─────────────────────────────────────────────────────────────
    "athletico-pr.png":  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Athletico_Paranaense_%28Logo_2019%29.svg/480px-Athletico_Paranaense_%28Logo_2019%29.svg.png",
    "atletico-mg.png":   "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.png",
    "bahia.png":         "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Esporte_Clube_Bahia_logo.svg/480px-Esporte_Clube_Bahia_logo.svg.png",
    "botafogo.png":      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/480px-Botafogo_de_Futebol_e_Regatas_logo.svg.png",
    "bragantino.png":    "https://upload.wikimedia.org/wikipedia/pt/9/9e/RedBullBragantino.png",
    "chapecoense.png":   "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Logo_Associa%C3%A7%C3%A3o_Chapecoense_de_Futebol.svg/480px-Logo_Associa%C3%A7%C3%A3o_Chapecoense_de_Futebol.svg.png",
    "corinthians.png":   "https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png",
    "coritiba.png":      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Coritiba_Foot_Ball_Club_logo.svg/480px-Coritiba_Foot_Ball_Club_logo.svg.png",
    "cruzeiro.png":      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg/480px-Cruzeiro_Esporte_Clube_%28logo%29.svg.png",
    "flamengo.png":      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Clube_de_Regatas_do_Flamengo_logo.svg/480px-Clube_de_Regatas_do_Flamengo_logo.svg.png",
    "fluminense.png":    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Fluminense_Football_Club.svg/480px-Fluminense_Football_Club.svg.png",
    "fortaleza.png":     "https://upload.wikimedia.org/wikipedia/commons/6/6d/Fortaleza_Esporte_Clube_logo.png",
    "gremio.png":        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/480px-Gremio_logo.svg.png",
    "internacional.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Sport_Club_Internacional_logo.svg/480px-Sport_Club_Internacional_logo.svg.png",
    "mirassol.png":      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Mirassol_Futebol_Clube_logo_%283_stars%29.png",
    "palmeiras.png":     "https://upload.wikimedia.org/wikipedia/commons/6/60/SE_Palmeiras_2025_crest.png",
    "remo.png":          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Clube_do_Remo.svg/480px-Clube_do_Remo.svg.png",
    "santos.png":        "https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.png",
    "sao-paulo.png":     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg/480px-Brasao_do_Sao_Paulo_Futebol_Clube.svg.png",
    "vasco.png":         "https://upload.wikimedia.org/wikipedia/pt/thumb/8/8b/EscudoDoVascoDaGama.svg/480px-EscudoDoVascoDaGama.svg.png",
    # ── Série B ─────────────────────────────────────────────────────────────
    "america-mg.png":    "https://upload.wikimedia.org/wikipedia/commons/7/7e/Escudo_Am%C3%A9rica_de_Minas.png",
    "atletico-go.png":   "https://upload.wikimedia.org/wikipedia/commons/9/91/Atl%C3%A9tico_Goianiense_logo_%28sem_estrelas%29.png",
    "avai.png":          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Ava%C3%AD_Futebol_Clube_logo.svg/480px-Ava%C3%AD_Futebol_Clube_logo.svg.png",
    "botafogo-sp.png":   "https://upload.wikimedia.org/wikipedia/commons/b/b5/Botafogo_Futebol_Clube_%28Ribeir%C3%A3o_Preto%29_logo_%282021%29.png",
    "ceara.png":         "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cear%C3%A1_Sporting_Club_logo.svg/480px-Cear%C3%A1_Sporting_Club_logo.svg.png",
    "crb.png":           "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/CRB_logo.svg/480px-CRB_logo.svg.png",
    "criciuma.png":      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Crici%C3%BAma_EC_2025_crest.svg/480px-Crici%C3%BAma_EC_2025_crest.svg.png",
    "cuiaba.png":        "https://upload.wikimedia.org/wikipedia/commons/6/68/Cuiab%C3%A1_EC_crest.png",
    "goias.png":         "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Goi%C3%A1s_Esporte_Clube_logo.svg/480px-Goi%C3%A1s_Esporte_Clube_logo.svg.png",
    "juventude.png":     "https://upload.wikimedia.org/wikipedia/commons/b/bf/Juventude_crest.png",
    "londrina.png":      "https://upload.wikimedia.org/wikipedia/en/7/7d/Londrina_E.C..png",
    "nautico.png":       "https://upload.wikimedia.org/wikipedia/pt/d/de/Simbolo-escudo-nautico.png",
    "novorizontino.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Gr%C3%AAmio_Novorizontino.svg/480px-Gr%C3%AAmio_Novorizontino.svg.png",
    "operario-pr.png":   "https://upload.wikimedia.org/wikipedia/commons/9/90/Oper%C3%A1rio_Ferrovi%C3%A1rio_EC_%28no_stars%29.png",
    "ponte-preta.png":   "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Logo_AA_Ponte_Preta.svg/480px-Logo_AA_Ponte_Preta.svg.png",
    "sao-bernardo.png":  "https://upload.wikimedia.org/wikipedia/commons/8/88/S%C3%A3o_Bernardo_FC_2020_crest.png",
    "sport.png":         "https://upload.wikimedia.org/wikipedia/pt/1/17/Sport_Club_do_Recife.png",
    "vila-nova.png":     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Vila_Nova_Logo_Oficial.svg/480px-Vila_Nova_Logo_Oficial.svg.png",
    "vitoria.png":       "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Esporte_Clube_Vit%C3%B3ria_%282024%29.svg/480px-Esporte_Clube_Vit%C3%B3ria_%282024%29.svg.png",
}


def download_and_save(filename: str, url: str) -> bool:
    out_path = OUTPUT_DIR / filename
    if out_path.exists():
        print(f"  ⏭  {filename} já existe, pulando")
        return True
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code != 200:
            print(f"  ✗  HTTP {resp.status_code} — {filename}")
            return False
        img = Image.open(BytesIO(resp.content))
        if img.mode not in ("RGBA", "LA"):
            img = img.convert("RGBA")
        img.thumbnail((240, 240), Image.LANCZOS)
        canvas = Image.new("RGBA", (240, 240), (0, 0, 0, 0))
        x = (240 - img.width) // 2
        y = (240 - img.height) // 2
        canvas.paste(img, (x, y), img if img.mode == "RGBA" else None)
        canvas.save(out_path, "PNG")
        print(f"  ✓  {filename}  ({img.width}×{img.height} → 240×240)")
        return True
    except Exception as e:
        print(f"  ✗  {filename}: {e}")
        return False


def main():
    print(f"⚽  Baixando {len(ESCUDOS)} escudos → {OUTPUT_DIR}\n")
    ok = fail = 0
    failed = []
    for filename, url in ESCUDOS.items():
        success = download_and_save(filename, url)
        if success:
            ok += 1
        else:
            fail += 1
            failed.append(filename)
        time.sleep(0.3)

    print(f"\n{'─'*50}")
    print(f"✅  Sucesso : {ok}/{len(ESCUDOS)}")
    if failed:
        print(f"❌  Falhas  : {', '.join(failed)}")
        sys.exit(1)
    else:
        print("🎉  Todos os escudos baixados!")


if __name__ == "__main__":
    main()
