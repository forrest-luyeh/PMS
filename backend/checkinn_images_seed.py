"""
Seed script: add cover images + descriptions for 29 CheckInn hotels
and description + cover image for every room type.

Images use picsum.photos with hotel/room-type slug as seed -> stable URLs.
Run: python checkinn_images_seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models.tenant import Hotel, HotelImage
from models.room import RoomType, RoomTypeImage

# ---------------------------------------------------------------------------
# Hotel data: slug -> (description, image_alt)
# ---------------------------------------------------------------------------
HOTEL_DATA = {
    # SELECT (藏居)
    "yangmingshan":   ("台北陽明山溫泉精品旅館，坐擁山林溫泉美景，交通方便。以細膩設計打造都市後山的靜謐隱所，是泡湯放鬆的絕佳選擇。", "雀客藏居台北陽明山溫泉館"),
    "nangang":        ("台北南港精品旅館，鄰近南港展覽館與捷運交匯。現代商務設施完善，是科技商務旅人的絕佳住所。", "雀客藏居台北南港館"),
    "neihu-select":   ("台北內湖精品旅館，毗鄰科技園區，交通便利。寬敞舒適的客房空間，是科技人長住與品味旅人的首選。", "雀客藏居台北內湖館"),
    "sanchong":       ("新北三重水岸精品旅館，面河景致絕佳，鄰近捷運三重站。以水岸自然景觀為背景，打造都市中的精緻水岸住宿體驗。", "雀客藏居新北三重水岸館"),
    "dadun":          ("台中大墩精品旅館，位於台中市中心黃金地段，鄰近草悟道與勤美商圈。以藝術品味融入住宿設計，帶給旅人獨特的中台灣體驗。", "雀客藏居台中大墩館"),
    "hualien-linsen": ("花蓮林森精品旅館，位於花蓮市中心，步行可達火車站。以太魯閣山海意象融入空間設計，是探索花東縱谷的絕佳據點。", "雀客藏居花蓮林森館"),
    "yongkang-select":("台南永康精品旅館，鄰近台南高鐵站，往來交通便捷。古都南台灣的精品住宿，串聯府城歷史文化與現代商圈。", "雀客藏居台南永康館"),
    # HOTEL (旅館)
    "main-station":   ("台北主站旅館，鄰近台北車站，捷運交匯，交通四通八達。現代化設計客房，是商務出行與觀光旅遊的便利住所。", "雀客旅館台北主站館"),
    "nanjing":        ("台北南京旅館，鄰近南京復興捷運站，松山機場可快速到達。商務設施完善，乾淨整潔，適合頻繁往來的旅人。", "雀客旅館台北南京館"),
    "neihu":          ("台北內湖旅館，緊鄰科技園區，步行可達捷運站。舒適明亮的客房，為科技旅客與商務人士提供高品質住宿。", "雀客旅館台北內湖館"),
    "songjiang":      ("台北松江旅館，位於中山商圈核心，鄰近松江南京站。地段優越，周邊美食林立，是體驗台北城市生活的理想選擇。", "雀客旅館台北松江館"),
    "xinyi":          ("台北信義旅館，鄰近台北101與信義商圈，是台北最繁華的商業核心。精品百貨、美食餐廳步行可達，享受都會頂級生活。", "雀客旅館台北信義館"),
    "zhongshan":      ("台北中山旅館，坐落中山北路藝術廊道旁，文藝氣息濃厚。鄰近圓山、林安泰古厝，適合喜愛文化探索的旅人。", "雀客旅館台北中山館"),
    "luzhou":         ("新北蘆洲旅館，毗鄰捷運蘆洲站，往返台北市中心便利。親切實惠的住宿選擇，是家庭旅遊與親子出行的好去處。", "雀客旅館新北蘆洲館"),
    "hive-yilan":     ("宜蘭羅東旅館，距羅東夜市步行可達，前往太平山輕鬆便捷。在地小吃文化豐富，是深度探索宜蘭的舒適住所。", "雀客旅館宜蘭羅東嗨夫館"),
    "chase":          ("台中 Chase Hotel，台中市中心設計型旅館，以大膽現代設計著稱。鄰近逢甲商圈，是喜歡個性旅宿的旅人首選。", "雀客旅館台中Chase Hotel"),
    "dream-tower":    ("台中河南夢塔旅館，外觀亮麗的地標建築，坐落河南路商圈。提供高樓層城市景觀客房，夜覽台中璀璨燈火。", "雀客旅館台中河南夢塔館"),
    "liming":         ("台中黎明旅館，位於台中黎明商圈，鄰近台中軟體園區。生活機能完善，提供舒適安靜的住宿環境。", "雀客旅館台中黎明館"),
    "qinghai":        ("台中青海旅館，坐落台中青海路商業核心，鄰近逢甲夜市。精選住宿空間，滿足旅人對舒適與便捷的雙重需求。", "雀客旅館台中青海館"),
    "wenxin":         ("台中文心中清旅館，文心路與中清路交叉口的優越地段。鄰近台中市政府特區，是商務與休閒兼具的住宿選擇。", "雀客旅館台中文心中清館"),
    "ziyou":          ("台中自由旅館，鄰近台中舊城文化區與中山路老街。旅館設計融合台中在地文化，帶來獨特的在地旅宿體驗。", "雀客旅館台中自由館"),
    "loveriver":      ("高雄愛河旅館，面愛河而設，坐享迷人水岸景致。鄰近駁二藝術特區，是感受高雄文創與海港氣息的絕佳住所。", "雀客旅館高雄愛河館"),
    # EXPRESS (快捷)
    "fengchia":       ("台中逢甲快捷旅館，步行即達逢甲夜市。智能自助服務讓入住流程零等待，是夜市饕客的最佳住宿選擇。", "雀客快捷台中逢甲館"),
    "fuxing":         ("台中復興快捷旅館，緊鄰台中火車站，交通便利。精簡乾淨的客房設計，提供旅人最高效率的住宿體驗。", "雀客快捷台中復興館"),
    "fuxing2":        ("台中復興二館，復興快捷的擴充館體，同享優越交通位置。全新客房設施，智能自助入住，旅途更加輕鬆自在。", "雀客快捷台中復興二館"),
    "yizhong":        ("台中一中快捷旅館，鄰近一中商圈與中友百貨。年輕活力的商圈氛圍，提供旅人最實惠舒適的台中住宿選擇。", "雀客快捷台中一中館"),
    "taipei-station": ("台北車站快捷旅館，台北交通樞紐旁，高鐵、台鐵、捷運步行可達。精簡高效的住宿空間，是轉乘旅客的最佳選擇。", "雀客快捷台北車站館"),
    "taipei-yongkang":("台北永康快捷旅館，大安區永康街步行圈內。文青咖啡、特色小吃俯拾即是，感受台北最有個性的生活街區。", "雀客快捷台北永康館"),
    "tamsui":         ("新北淡水快捷旅館，鄰近淡水老街與捷運站。漁人碼頭夕陽、老街小吃盡在步行範圍，是淡水旅遊的舒適棲所。", "雀客快捷新北淡水館"),
}

# Room type description templates by bed type
ROOM_DESC = {
    "DOUBLE": "雙人大床房，{size}，設有獨立衛浴與智能控制面板，提供舒適私密的雙人住宿空間。",
    "TWIN":   "雙床房，{size}，兩張單人床配置，適合雙人出遊或商務同行，空間寬敞明亮。",
    "FAMILY": "家庭房，{size}，大床加上加床配置，最多可入住 4 人，是親子旅遊的理想選擇。",
    "SINGLE": "單人房，{size}，精巧格局設計，所有基本設施一應俱全，獨旅旅人的舒適棲所。",
}

def picsum_hotel_url(slug: str) -> str:
    return f"https://picsum.photos/seed/{slug}/1200/800"

def picsum_rt_url(hotel_slug: str, room_code: str) -> str:
    seed = f"{hotel_slug}-{room_code}" if room_code else f"{hotel_slug}-rt"
    return f"https://picsum.photos/seed/{seed}/800/600"

def size_label(sqm) -> str:
    if sqm:
        return f"{sqm} m²"
    return "約 20–30 m²"

def main():
    db = SessionLocal()
    try:
        hotels = db.query(Hotel).filter(Hotel.is_active == True).all()
        h_updated = h_img_added = rt_updated = rt_img_added = 0

        for hotel in hotels:
            data = HOTEL_DATA.get(hotel.slug)

            # ── Hotel description ──────────────────────────────────────────
            if data and not hotel.description:
                hotel.description = data[0]
                h_updated += 1

            # ── Hotel image ────────────────────────────────────────────────
            if not hotel.images:
                alt = data[1] if data else hotel.name
                db.add(HotelImage(
                    hotel_id=hotel.id,
                    url=picsum_hotel_url(hotel.slug),
                    alt_text=alt,
                    sort_order=0,
                ))
                h_img_added += 1

            # ── Room types ─────────────────────────────────────────────────
            for rt in db.query(RoomType).filter_by(hotel_id=hotel.id).all():
                bed = (rt.bed_type or "DOUBLE").upper()
                tmpl = ROOM_DESC.get(bed, ROOM_DESC["DOUBLE"])

                if not rt.description:
                    rt.description = tmpl.format(size=size_label(getattr(rt, "size_sqm", None)))
                    rt_updated += 1

                has_img = db.query(RoomTypeImage).filter_by(room_type_id=rt.id).first()
                if not has_img:
                    db.add(RoomTypeImage(
                        room_type_id=rt.id,
                        url=picsum_rt_url(hotel.slug, rt.room_code or str(rt.id)),
                        alt_text=rt.name,
                        sort_order=0,
                    ))
                    rt_img_added += 1

        db.commit()
        print(f"[OK] Hotels: {h_updated} descriptions updated, {h_img_added} images added")
        print(f"[OK] Room types: {rt_updated} descriptions updated, {rt_img_added} images added")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
