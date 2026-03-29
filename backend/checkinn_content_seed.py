"""
Seed hero slides, testimonials, is_featured hotels, and tenant contact/social
for the CheckInn tenant.

Run from backend/:
    python checkinn_content_seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models.tenant import Tenant, Hotel
from models.testimonial import Testimonial
from models.hero_slide import HeroSlide

db = SessionLocal()

# ── 1. Tenant contact & social ────────────────────────────────────────────────

tenant = db.query(Tenant).filter_by(slug="checkinn").first()
if not tenant:
    print("[ERROR] CheckInn tenant not found. Run checkinn_seed.py first.")
    sys.exit(1)

tenant.contact_phone = "+886-4-3509-5396"
tenant.social_instagram = "https://www.instagram.com/checkinn_official"
tenant.social_facebook = "https://www.facebook.com/checkinn.official"
tenant.social_line = "https://line.me/R/ti/p/@checkinn"
db.flush()
print("[OK] Tenant contact/social updated")

# ── 2. Hero Slides ────────────────────────────────────────────────────────────

existing_slides = db.query(HeroSlide).filter_by(tenant_id=tenant.id).count()
if existing_slides == 0:
    SLIDES = [
        HeroSlide(
            tenant_id=tenant.id,
            image_url="https://picsum.photos/seed/checkinn-hero-main/1920/1080",
            label="Taiwan's Smartest Hotel Chain",
            headline="STAY EASY.",
            subline="STAY SMART.",
            sort_order=0,
            is_active=True,
        ),
        HeroSlide(
            tenant_id=tenant.id,
            image_url="https://picsum.photos/seed/checkinn-select-hero/1920/1080",
            label="品牌系列",
            headline="雀客藏居 SELECT",
            subline="精品溫泉 · 私人湯屋 · 靜謐奢華",
            link_url="/hotels?brand=select",
            link_label="探索藏居",
            sort_order=1,
            is_active=True,
        ),
        HeroSlide(
            tenant_id=tenant.id,
            image_url="https://picsum.photos/seed/checkinn-selfcheckin/1920/1080",
            label="智能旅宿體驗",
            headline="自助 Check-in",
            subline="3 分鐘完成入住 · 免排隊 · 24 小時彈性辦理",
            link_url="/about/self-checkin",
            link_label="了解流程",
            sort_order=2,
            is_active=True,
        ),
    ]
    for s in SLIDES:
        db.add(s)
    db.flush()
    print(f"[OK] {len(SLIDES)} hero slides added")
else:
    print(f"[SKIP] Hero slides already exist ({existing_slides})")

# ── 3. Testimonials ───────────────────────────────────────────────────────────

existing_testimonials = db.query(Testimonial).filter_by(tenant_id=tenant.id).count()
if existing_testimonials == 0:
    TESTIMONIALS = [
        Testimonial(
            tenant_id=tenant.id,
            author_name="Petah C.",
            author_tag="商務旅客",
            quote="在這裡住了三週出差，被五星級的服務品質深深震撼！自助 Check-in 超方便，每天回來都像回家一樣。",
            sort_order=0,
            is_active=True,
        ),
        Testimonial(
            tenant_id=tenant.id,
            author_name="Margaret W.",
            author_tag="旅遊愛好者",
            quote="這麼高品質的平價旅館，真的不想讓太多人知道！乾淨、安靜、地點超好，下次還要再來。",
            sort_order=1,
            is_active=True,
        ),
        Testimonial(
            tenant_id=tenant.id,
            author_name="Kevin L.",
            author_tag="親子旅遊",
            quote="附近美食選擇豐富，交通非常方便。房間設備新穎，早餐也很好吃，CP 值超高的選擇！",
            sort_order=2,
            is_active=True,
        ),
    ]
    for t in TESTIMONIALS:
        db.add(t)
    db.flush()
    print(f"[OK] {len(TESTIMONIALS)} testimonials added")
else:
    print(f"[SKIP] Testimonials already exist ({existing_testimonials})")

# ── 4. Featured hotels (one per brand) ───────────────────────────────────────

# Clear existing featured flags first
db.query(Hotel).filter_by(tenant_id=tenant.id, is_featured=True).update({"is_featured": False})
db.flush()

# Pick one representative hotel per brand (by slug substring)
FEATURED_SLUGS = ["yangmingshan", "songjiang", "taipei-station"]
featured_count = 0
for slug in FEATURED_SLUGS:
    hotel = db.query(Hotel).filter(
        Hotel.tenant_id == tenant.id,
        Hotel.slug == slug,
    ).first()
    if hotel:
        hotel.is_featured = True
        featured_count += 1
        print(f"[OK] Marked featured: {hotel.name} ({slug})")
    else:
        # Try partial match
        hotel = db.query(Hotel).filter(
            Hotel.tenant_id == tenant.id,
            Hotel.slug.contains(slug.split("-")[0]),
        ).first()
        if hotel:
            hotel.is_featured = True
            featured_count += 1
            print(f"[OK] Marked featured (partial): {hotel.name}")
        else:
            print(f"[WARN] Hotel not found: {slug}")

if featured_count < 3:
    # Fallback: mark first hotel from each brand as featured
    from models.tenant import Brand
    brands = db.query(Brand).filter_by(tenant_id=tenant.id).all()
    for brand in brands:
        hotels = db.query(Hotel).filter_by(
            brand_id=brand.id, tenant_id=tenant.id, is_active=True
        ).order_by(Hotel.id).all()
        for h in hotels:
            if not h.is_featured:
                h.is_featured = True
                print(f"[OK] Marked featured (fallback): {h.name}")
                break

db.commit()
print("[DONE] Content seed complete")
