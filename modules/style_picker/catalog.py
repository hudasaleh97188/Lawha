"""Style Picker. Occasion categories and style → prompt injection map."""
from __future__ import annotations

STYLES: dict[str, dict] = {
    "same": {"name": "Keep Original", "injection": ""},
    "islamic_geometric": {"name": "Islamic Geometric",
        "injection": "intricate geometric patterns, arabesque borders, deep jewel tones, gold accents"},
    "floral_soft": {"name": "Floral & Soft",
        "injection": "delicate watercolor florals, pastel palette, soft bokeh, organic curves"},
    "minimalist_gold": {"name": "Minimalist Gold",
        "injection": "clean white space, single gold accent line, elegant serif typography"},
    "neon_glow": {"name": "Neon Glow",
        "injection": "dark background, vibrant neon light trails, glowing edges, cyberpunk mood"},
    "cinematic": {"name": "Cinematic Dark",
        "injection": "dramatic side lighting, film grain, deep shadows, anamorphic lens flare"},
    "watercolor": {"name": "Watercolor",
        "injection": "loose brush strokes, bleed edges, muted earth tones, handmade texture"},
    "ramadan_lantern": {"name": "Ramadan Night",
        "injection": "deep indigo sky, golden lantern glow, crescent moon, star clusters"},
    "custom": {"name": "Custom", "injection": ""},
}

OCCASIONS: dict[str, dict] = {
    "eid_al_fitr":   {"label": "Eid Al-Fitr",   "default_style": "islamic_geometric",
                      "tone": "spiritual celebratory"},
    "eid_al_adha":   {"label": "Eid Al-Adha",   "default_style": "islamic_geometric",
                      "tone": "spiritual reverent"},
    "ramadan":       {"label": "Ramadan Kareem", "default_style": "ramadan_lantern",
                      "tone": "spiritual serene"},
    "friday_dua":    {"label": "Friday Dua",    "default_style": "minimalist_gold",
                      "tone": "spiritual reflective"},
    "birthday":      {"label": "Birthday",      "default_style": "neon_glow",
                      "tone": "joyful warm"},
    "anniversary":   {"label": "Anniversary",   "default_style": "floral_soft",
                      "tone": "romantic warm"},
    "graduation":    {"label": "Graduation",    "default_style": "minimalist_gold",
                      "tone": "celebratory proud"},
    "wedding":       {"label": "Wedding",       "default_style": "floral_soft",
                      "tone": "romantic elegant"},
    "new_year":      {"label": "New Year",      "default_style": "neon_glow",
                      "tone": "festive energetic"},
    "national_day":  {"label": "National Day",  "default_style": "cinematic",
                      "tone": "proud patriotic"},
    "motivational":  {"label": "Motivational",  "default_style": "cinematic",
                      "tone": "bold energetic"},
    "custom":        {"label": "Custom",        "default_style": "custom", "tone": "neutral"},
}


def get_style_injection(style_id: str, custom_text: str = "") -> str:
    if style_id == "custom":
        return custom_text
    return STYLES.get(style_id, {}).get("injection", "")


def get_occasion_defaults(occasion_id: str) -> dict:
    return OCCASIONS.get(occasion_id, OCCASIONS["custom"])
