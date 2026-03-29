"""
Seed script: import CheckInn public website content into the posts table.
Run after checkinn_seed.py (requires checkinn tenant to exist).

Usage:
    cd backend
    venv\\Scripts\\python checkinn_posts_seed.py
"""

from datetime import datetime, timezone
from database import SessionLocal
from models.tenant import Tenant
from models.post import Post, PostType


POSTS = [
    # ── Activity 活動快訊 ────────────────────────────────────────────────────
    {
        "post_type": PostType.ACTIVITY,
        "title": "雀客國際酒店會員權益調整通知",
        "slug": "member-benefits-adjustment-2026",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2026/03/announce_checkinn.jpg",
        "excerpt": "感謝您長期對雀客旅館集團的支持！即日起新制會員系統正式上線，升等規則由「累計消費金額」改為「累計住房晚數」，現有會員效期延至 2027/2/28（白金終身不受影響）。",
        "body": """<p>感謝您長期對雀客旅館集團的支持與厚愛！</p>
<h3>升等規則調整</h3>
<p>新制會員系統自 2026 年 3 月 9 日起生效，升等規則由「累計消費金額」改為<strong>「年度累計住房晚數」</strong>（每年 1/1–12/31 計算，年底歸零）。</p>
<h3>現有會員效期</h3>
<p>既有會員效期延至 <strong>2027 年 2 月 28 日</strong>（白金終身會員不受影響）。</p>
<h3>點數效期</h3>
<p>現有點數使用期限延至 <strong>2027 年 12 月 31 日</strong>；新制點數將設定明確到期日。</p>
<h3>升等新亮點</h3>
<ul>
<li>年度達標晚數即可升等，規則更簡單透明</li>
<li>銀卡（含）以上升等時贈送晚退房優惠券</li>
<li>適用館別涵蓋雀客旅館、雀客藏居、雀客快捷等 13 個品牌旗下旅館</li>
</ul>
<p>繼續使用服務即視為同意最新會員條款與隱私政策，請至官網查閱完整內容。</p>""",
        "is_published": True,
        "published_at": datetime(2026, 3, 5, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.ACTIVITY,
        "title": "喜年來 2026 春節跨界聯名",
        "slug": "lunar-new-year-2026-xinianlai",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2026/01/event_20269130.jpg",
        "excerpt": "用一口經典，喚醒記憶中的年節溫暖。結合在地風味與旅宿美學，讓每次相遇，都成為旅人最美的獨家記憶。美好 2026，就從這裡喜 CHECK 年來。",
        "body": """<p>雀客旅館集團 × 喜年來，聯名推出 2026 春節限定禮盒，內含經典蛋捲點心禮、防水旅行收納袋、紀念小鳥擺件，獨家春節溫情組合。</p>
<h3>活動期間</h3>
<p>2026 年 2 月 6 日 – 4 月 6 日（農曆年間特定場館適用）</p>
<h3>參與館別</h3>
<ul>
<li>雀客藏居 南投永康館</li>
<li>雀客旅館 新北三重水漾館</li>
<li>雀客旅館 台北松江館</li>
<li>宜蘭 Magikids 親子館</li>
<li>藏月閣中餐廳（台北陽明山）</li>
</ul>
<h3>早鳥優惠</h3>
<p>1/23–2/5 搶先預訂享 5 折優惠，訂房即送限量聯名禮盒！</p>""",
        "is_published": True,
        "published_at": datetime(2026, 1, 30, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.ACTIVITY,
        "title": "2026 馬到金來喜迎新春｜尾牙春酒饗宴",
        "slug": "yangmingshan-year-end-banquet-2026",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2025/11/2025yms-endparty.jpg",
        "excerpt": "為辛勞的一年乾杯，一起呷尾牙、飲春酒喜迎金馬，美饌桌宴 NT$9,888 起，用餐當日再享大眾溫泉池泡湯 7 折優惠！",
        "body": """<p>雀客藏居 台北陽明山溫泉飯店誠摯邀請您蒞臨年末盛宴，與親友共享尾牙春酒！</p>
<h3>活動期間</h3>
<p>2025 年 12 月 19 日 – 2026 年 3 月 31 日（農曆年假 2/16–2/21 除外）</p>
<h3>套餐方案</h3>
<ul>
<li><strong>經典平日桌宴</strong>：NT$9,888 + 10%（10 人桌）</li>
<li><strong>豐盛桌宴</strong>：NT$12,888 + 10%（10 人桌）</li>
<li><strong>尊爵桌宴</strong>：NT$16,888 + 10%（10 人桌，含開胃酒、佐餐酒）</li>
</ul>
<h3>專屬優惠</h3>
<p>用餐當日憑餐飲消費，大眾溫泉池入場費享 7 折優惠（NT$700，原價 NT$1,000）。</p>
<p>場地設備：投影機、螢幕、舞台、無線麥克風。</p>
<p>📞 預約專線：(02)2861-6661</p>""",
        "is_published": True,
        "published_at": datetime(2025, 12, 26, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.ACTIVITY,
        "title": "2026 馬躍新歲 新春吉品宴｜除夕年菜、外帶",
        "slug": "yangmingshan-lunar-new-year-dinner-2026",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2025/12/2026yms-newyear.jpg",
        "excerpt": "澎派滿桌的圍爐餐宴，為您帶來團圓的滿滿祝福。雀客藏居台北陽明山溫泉飯店，2026 農曆新年除夕及春節期間，外帶年菜、圍爐餐宴同步接受預訂。",
        "body": """<p>與家人在陽明山上迎接 2026 農曆新年，雀客藏居台北陽明山溫泉飯店特別推出新春圍爐餐宴。</p>
<h3>活動期間</h3>
<p>2026 年 2 月 16 日（除夕）– 2 月 21 日（初五）</p>
<h3>圍爐套餐</h3>
<ul>
<li><strong>闔家團圓餐</strong>：NT$2,988 + 10%（2 人份）</li>
<li><strong>瑞麒臨門宴</strong>：NT$9,888 + 10%（6 人桌）</li>
<li><strong>鴻福齊天宴</strong>：NT$22,888 + 10%（10 人桌，含開胃酒）</li>
</ul>
<h3>早鳥加碼</h3>
<p>預訂即贈果汁一壺，高階方案加贈大眾溫泉入場券。</p>
<h3>外帶年菜</h3>
<p>傳統粵式年菜外帶包，需提前預訂，截止日期依官網公告為準。</p>
<p>📞 預約專線：(02)2861-6661</p>""",
        "is_published": True,
        "published_at": datetime(2025, 12, 19, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.ACTIVITY,
        "title": "2026【永續美好 慢遊台灣】高鐵聯票年度專案",
        "slug": "thsr-hotel-package-2026",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2025/12/event_2026thsrc.jpg",
        "excerpt": "與雀客一起愛護地球，來趟低碳環保新旅行！官網訂房優惠，享平日限量房型升等！搭高鐵、住雀客，成人票享 78 折，假日 85 折。",
        "body": """<p>雀客旅館集團 × 台灣高速鐵路，攜手推出 2026 年度永續旅遊聯票專案。選擇高鐵低碳出行，搭配旅館優質住宿，一次滿足環保與便利。</p>
<h3>活動期間</h3>
<p>2025 年 10 月 15 日 – 2026 年 12 月 31 日</p>
<h3>票價優惠</h3>
<ul>
<li>成人票：平日 78 折、假日 85 折</li>
<li>優待/敬老/孩童票：一律 5 折</li>
</ul>
<h3>參與館別</h3>
<ul>
<li>雀客旅館 台北松江館</li>
<li>雀客旅館 台北站前館</li>
</ul>
<h3>注意事項</h3>
<p>限官網直訂，不含早餐，平日可享限量房型升等。票券變更及取消依高鐵規定辦理。</p>
<p>🌱 低碳旅行，從搭高鐵開始！</p>""",
        "is_published": True,
        "published_at": datetime(2025, 12, 10, 10, 0, 0, tzinfo=timezone.utc),
    },

    # ── News 最新消息 ────────────────────────────────────────────────────────
    {
        "post_type": PostType.NEWS,
        "title": "「亞洲萬里通」里數累積優惠",
        "slug": "asia-miles-promotion-2026",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2025/01/亞萬Banner-雀客2026-scaled.jpg",
        "excerpt": "入住雀客旅館，每消費 NT$30 累積 1 哩！活動期間至 2026 年 12 月 31 日，適用雀客旗下品牌旅館（金門、布圖及海外館除外）。",
        "body": """<p>雀客旅館集團與國泰航空「亞洲萬里通」強強聯手，讓您住宿同時累積飛行里數！</p>
<h3>累積方式</h3>
<p>每消費 <strong>NT$30</strong> 累積 <strong>1 亞洲萬里通里數</strong>，以實際住宿費用計算（不含稅金及服務費）。</p>
<h3>活動期間</h3>
<p>即日起至 <strong>2026 年 12 月 31 日</strong></p>
<h3>如何參與</h3>
<ol>
<li>透過雀客官網訂房，選擇「CHECK inn X Asia Miles」方案</li>
<li>在備註欄填寫您的國泰飛行常客號碼（10 碼）</li>
<li>退房後 7 個工作天內里數將自動入帳</li>
</ol>
<h3>注意事項</h3>
<ul>
<li>不可與其他折扣方案合併使用</li>
<li>透過 Booking.com、Agoda 等第三方訂房平台訂房不適用</li>
<li>適用館別涵蓋雀客藏居、雀客旅館、雀客快捷（金門、布圖及海外館除外）</li>
</ul>""",
        "is_published": True,
        "published_at": datetime(2026, 2, 4, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.NEWS,
        "title": "雀客國際酒店會員權益調整通知",
        "slug": "member-benefits-adjustment-2026-news",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2026/03/announce_checkinn.jpg",
        "excerpt": "感謝您長期對雀客旅館集團的支持！即日起新制會員系統正式上線，升等規則由「累計消費金額」改為「累計住房晚數」。",
        "body": """<p>感謝您長期對雀客旅館集團的支持與厚愛！</p>
<p>為提供更簡單透明的會員制度，我們於 2026 年 3 月 9 日起正式啟用新制會員系統。</p>
<h3>主要調整項目</h3>
<ul>
<li><strong>升等規則</strong>：由「累計消費金額」改為「年度累計住房晚數」（1/1–12/31，年底歸零）</li>
<li><strong>既有會員效期</strong>：延至 2027/2/28（白金終身會員不受影響）</li>
<li><strong>點數效期</strong>：現有點數可使用至 2027/12/31</li>
<li><strong>銀卡以上</strong>升等時贈送晚退房優惠券</li>
</ul>
<p>詳情請至官網查閱完整會員條款。繼續使用服務即視為同意最新條款。</p>""",
        "is_published": True,
        "published_at": datetime(2026, 3, 5, 11, 0, 0, tzinfo=timezone.utc),
    },

    # ── Traveler 旅人誌 ──────────────────────────────────────────────────────
    {
        "post_type": PostType.TRAVELER,
        "title": "Traveler log 雀客旅人誌｜娃娃",
        "slug": "traveler-log-waa",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2025/05/travellog-waa01.jpg",
        "excerpt": "娃娃入住雀客旅館台北信義館，貼心服務搭配絕佳地理位置，每天都能欣賞台北 101 的美麗風景。",
        "body": """<p><strong>#入住館別：雀客旅館 台北信義館</strong></p>
<p>Welcome to CHECK inn！</p>
<p>很榮幸迎接娃娃的到來 🐦</p>
<p>貼心服務，搭配最便利的地理位置，讓娃娃在台北信義館的每一天，都能盡情欣賞 <strong>TAIPEI 101 的風景</strong>。</p>
<p>期待再次相遇，歡迎您隨時回家！</p>""",
        "is_published": True,
        "published_at": datetime(2025, 5, 21, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.TRAVELER,
        "title": "Traveler log 雀客旅人誌｜Martin",
        "slug": "traveler-log-martin",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2022/04/方馬丁-01-scaled.jpg",
        "excerpt": "用絕佳的景觀房接待 Martin，超大面窗可鳥瞰二二八公園欣賞綠意盎然，還有足夠的空間運動、健身，盡情在灑滿陽光的房間享受優質住宿！",
        "body": """<p><strong>#入住館別：雀客旅館 台北站前</strong></p>
<p>Welcome to CHECK inn</p>
<p>Welcome Home！</p>
<p>用絕佳的景觀房接待 Martin，</p>
<p>不僅有超大面窗，可以鳥瞰二二八公園欣賞綠意盎然，</p>
<p>還有足夠的空間運動、健身，</p>
<p>盡情在灑滿陽光的房間享受優質的住宿假期！</p>
<p>點擊查看 ▶▶ <a href="https://www.instagram.com/p/CTtIbKGlY64/" target="_blank" rel="noopener">馬丁的入住分享</a></p>""",
        "is_published": True,
        "published_at": datetime(2022, 4, 7, 10, 0, 0, tzinfo=timezone.utc),
    },
    {
        "post_type": PostType.TRAVELER,
        "title": "Traveler log 雀客旅人誌｜Fabio",
        "slug": "traveler-log-fabio",
        "cover_image_url": "https://www.checkinn.com.tw/wp-content/uploads/2022/04/法比歐-01-scaled.jpg",
        "excerpt": "我們提供的服務從預約的過程簡單快速，溝通沒有障礙。Fabio 開心地說：房間超級乾淨，床也是超級舒適，飯店人員每天都溫暖關心客人的健康狀況。",
        "body": """<p><strong>#入住館別：雀客旅館 台北站前</strong></p>
<p>我們提供的服務從預約的過程簡單快速，溝通沒有障礙。</p>
<p>更讓 Fabio 開心的是房間超級乾淨，床也是超級舒適，</p>
<p>飯店人員每天都溫暖關心客人的健康狀況。</p>
<blockquote><p>「房間超級乾淨，床也是超級舒適，飯店人員每天都溫暖關心客人的健康狀況。」— Fabio</p></blockquote>""",
        "is_published": True,
        "published_at": datetime(2022, 4, 7, 9, 0, 0, tzinfo=timezone.utc),
    },
]


def main():
    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter_by(slug="checkinn").first()
        if not tenant:
            print("[ERROR] Tenant 'checkinn' not found. Run checkinn_seed.py first.")
            return

        created = 0
        skipped = 0
        for data in POSTS:
            existing = db.query(Post).filter_by(tenant_id=tenant.id, slug=data["slug"]).first()
            if existing:
                skipped += 1
                continue

            post = Post(tenant_id=tenant.id, **data)
            db.add(post)
            created += 1

        db.commit()
        print(f"[OK] Done -- {created} posts created, {skipped} already existed.")
        print(f"     Tenant: {tenant.name} (id={tenant.id})")

    finally:
        db.close()


if __name__ == "__main__":
    main()
