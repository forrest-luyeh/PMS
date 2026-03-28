"""
checkinn_seed.py
匯入雀客旅館集團 (Check Inn) 品牌、旅館、房型、圖片、設施資料。
Idempotent：重複執行不會新增重複資料。
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Tenant, Brand, Hotel, HotelImage, HotelAmenity
from models import RoomType, RoomTypeImage, RoomTypeAmenity, Room
from models.room import RoomStatus

BASE_IMG = "https://www.checkinn.com.tw/wp-content/uploads/"

# ── 通用旅館設施 ──────────────────────────────────────────────────────────────
COMMON_AMENITIES = [
    {"name": "免費 Wi-Fi",                  "category": "服務"},
    {"name": "自助 Check-in/Check-out",     "category": "服務"},
    {"name": "行李寄放",                    "category": "服務"},
    {"name": "停車場",                      "category": "交通"},
    {"name": "電梯安全系統",                "category": "安全"},
    {"name": "滅火器",                      "category": "安全"},
]

# ── 房型通用設施 ───────────────────────────────────────────────────────────────
ROOM_AMENITIES_BASE = [
    {"name": "獨立空調",        "category": "設備"},
    {"name": "32吋以上智慧電視","category": "設備"},
    {"name": "8組萬國插座",     "category": "設備"},
    {"name": "免費礦泉水",      "category": "服務"},
    {"name": "獨立衛浴",        "category": "衛浴"},
    {"name": "吹風機",          "category": "衛浴"},
]

# ── 品牌 → 旅館 → 房型資料 ───────────────────────────────────────────────────
BRANDS = [
    {
        "name": "雀客藏居 CHECK inn Select",
        "slug": "select",
        "hotels": [
            {
                "name": "台北陽明山溫泉館",
                "slug": "yangmingshan",
                "address": "台北市士林區",
                "region": "北部",
                "phone": "+886-2-2861-8000",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [
                    BASE_IMG + "2025/05/藏居陽明山紗帽溫泉房-933x1024.jpg",
                ],
                "room_types": [
                    {
                        "name": "溫泉雙人房", "room_code": "JD",
                        "bed_type": "DOUBLE", "has_window": True,
                        "base_rate": 4200, "max_occupancy": 2,
                        "amenities": [{"name": "私人湯屋", "category": "設備"}],
                        "images": [BASE_IMG + "2025/05/藏居陽明山紗帽溫泉房-933x1024.jpg"],
                    },
                    {
                        "name": "景觀溫泉雙人房", "room_code": "WVD",
                        "bed_type": "DOUBLE", "has_window": True,
                        "base_rate": 5500, "max_occupancy": 2,
                        "amenities": [{"name": "私人湯屋", "category": "設備"}, {"name": "山景陽台", "category": "設備"}],
                        "images": [],
                    },
                ],
            },
            {
                "name": "台北南港館",
                "slug": "nangang",
                "address": "台北市南港區",
                "region": "北部",
                "phone": "+886-2-2788-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "雀躍雙人房", "room_code": "JD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 5500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台北內湖館",
                "slug": "neihu-select",
                "address": "台北市內湖區",
                "region": "北部",
                "phone": "+886-2-7726-6277",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "雀躍雙人房", "room_code": "JD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 5500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "無限家庭房", "room_code": "DXF", "bed_type": "FAMILY","has_window": True, "base_rate": 6500, "max_occupancy": 4, "amenities": [], "images": []},
                ],
            },
            {
                "name": "新北三重水岸館",
                "slug": "sanchong",
                "address": "新北市三重區",
                "region": "北部",
                "phone": "+886-2-2288-1234",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "雀躍雙人房", "room_code": "JD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 5500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中大墩館",
                "slug": "dadun",
                "address": "台中市西屯區",
                "region": "中部",
                "phone": "+886-4-2313-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "雀躍雙人房", "room_code": "JD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 5500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台南永康館",
                "slug": "yongkang-select",
                "address": "台南市永康區",
                "region": "南部",
                "phone": "+886-6-302-8888",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "雀躍雙人房", "room_code": "JD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 3800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 5500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "花蓮林森館",
                "slug": "hualien-linsen",
                "address": "花蓮市林森路",
                "region": "東部",
                "phone": "+886-3-832-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "雀躍雙人房", "room_code": "JD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 4000, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 5500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
        ],
    },
    {
        "name": "雀客旅館 CHECKinn Hotel",
        "slug": "hotel",
        "hotels": [
            {
                "name": "台北松江館",
                "slug": "songjiang",
                "address": "台北市中山區松江路253號",
                "region": "北部",
                "phone": "+886-2-2509-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [
                    BASE_IMG + "2026/01/CI001-featured.jpg",
                    BASE_IMG + "2026/01/CI001-04.jpg",
                ],
                "room_types": [
                    {
                        "name": "經典雙人房", "room_code": "CD",
                        "bed_type": "DOUBLE", "has_window": True,
                        "base_rate": 2500, "max_occupancy": 2,
                        "amenities": [{"name": "SIMMONS 床墊", "category": "床寢"}],
                        "images": [BASE_IMG + "2026/01/CI001CD-01.jpg"],
                    },
                    {
                        "name": "經典雙床房", "room_code": "CT",
                        "bed_type": "TWIN", "has_window": True,
                        "base_rate": 2500, "max_occupancy": 2,
                        "amenities": [{"name": "SIMMONS 床墊", "category": "床寢"}],
                        "images": [BASE_IMG + "2026/01/CI001CT-01.jpg"],
                    },
                    {
                        "name": "景觀雙人房", "room_code": "WVD",
                        "bed_type": "DOUBLE", "has_window": True,
                        "base_rate": 3500, "max_occupancy": 2,
                        "amenities": [],
                        "images": [BASE_IMG + "2026/01/CI001-WVD02.jpg"],
                    },
                ],
            },
            {
                "name": "台北主站館",
                "slug": "main-station",
                "address": "台北市中正區",
                "region": "北部",
                "phone": "+886-2-2331-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "經典雙床房", "room_code": "CT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 3500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台北南京館",
                "slug": "nanjing",
                "address": "台北市中山區南京東路",
                "region": "北部",
                "phone": "+886-2-2516-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台北內湖館",
                "slug": "neihu",
                "address": "台北市內湖區",
                "region": "北部",
                "phone": "+886-2-2799-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台北信義館",
                "slug": "xinyi",
                "address": "台北市信義區",
                "region": "北部",
                "phone": "+886-2-2723-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 3500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "新北蘆洲館",
                "slug": "luzhou",
                "address": "新北市蘆洲區",
                "region": "北部",
                "phone": "+886-2-2282-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中自由館",
                "slug": "ziyou",
                "address": "台中市西屯區自由路",
                "region": "中部",
                "phone": "+886-4-2313-8888",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中青海館",
                "slug": "qinghai",
                "address": "台中市西屯區青海南街150號",
                "region": "中部",
                "phone": "+886-4-2315-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 3500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中文心中清館",
                "slug": "wenxin",
                "address": "台中市北區文心路",
                "region": "中部",
                "phone": "+886-4-2296-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中黎明館",
                "slug": "liming",
                "address": "台中市南屯區黎明路",
                "region": "中部",
                "phone": "+886-4-2382-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中中山館",
                "slug": "zhongshan",
                "address": "台中市中區中山路",
                "region": "中部",
                "phone": "+886-4-2226-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中河南夢塔館",
                "slug": "dream-tower",
                "address": "台中市西屯區河南路",
                "region": "中部",
                "phone": "+886-4-2313-6699",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 3500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "台中 Chase Hotel",
                "slug": "chase",
                "address": "台中市西屯區",
                "region": "中部",
                "phone": "+886-4-2313-9900",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 3500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
            {
                "name": "宜蘭羅東嗨夫館",
                "slug": "hive-yilan",
                "address": "宜蘭縣羅東鎮公正路38號",
                "region": "東部",
                "phone": "+886-3-957-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "經典雙人房", "room_code": "CD", "bed_type": "DOUBLE", "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "雀躍雙床房", "room_code": "JT", "bed_type": "TWIN",   "has_window": True, "base_rate": 2800, "max_occupancy": 2, "amenities": [], "images": []},
                    {"name": "景觀雙人房", "room_code": "WVD","bed_type": "DOUBLE", "has_window": True, "base_rate": 3500, "max_occupancy": 2, "amenities": [], "images": []},
                ],
            },
        ],
    },
    {
        "name": "雀客快捷 CHECKinn Express",
        "slug": "express",
        "hotels": [
            {
                "name": "台北車站館",
                "slug": "taipei-station",
                "address": "台北市大同區太原路64號",
                "region": "北部",
                "phone": "+886-2-2555-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [
                    BASE_IMG + "2022/03/雀客快捷-台北車站-333-01-933x1024.jpg",
                    BASE_IMG + "2022/03/雀客快捷-台北車站-222-01-933x1024.jpg",
                ],
                "room_types": [
                    {
                        "name": "純捷雙人房", "room_code": "EXP-NW",
                        "bed_type": "DOUBLE", "has_window": False,
                        "base_rate": 1800, "max_occupancy": 2,
                        "amenities": [],
                        "images": [BASE_IMG + "2022/03/雀客快捷-台北車站-222-01-933x1024.jpg"],
                    },
                    {
                        "name": "快捷家庭房", "room_code": "SPF",
                        "bed_type": "FAMILY", "has_window": True,
                        "base_rate": 3200, "max_occupancy": 4,
                        "amenities": [],
                        "images": [BASE_IMG + "2022/03/雀客快捷-台北車站-333-01-933x1024.jpg"],
                    },
                ],
            },
            {
                "name": "台北永康館",
                "slug": "taipei-yongkang",
                "address": "台北市大安區永康街",
                "region": "北部",
                "phone": "+886-2-2391-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "快捷雙床房", "room_code": "CT",     "bed_type": "TWIN",  "has_window": True, "base_rate": 2000,"max_occupancy": 2,"amenities": [],"images": []},
                ],
            },
            {
                "name": "新北淡水館",
                "slug": "tamsui",
                "address": "新北市淡水區",
                "region": "北部",
                "phone": "+886-2-2629-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "景觀雙人房", "room_code": "WVD",    "bed_type": "DOUBLE","has_window": True, "base_rate": 2500,"max_occupancy": 2,"amenities": [],"images": []},
                ],
            },
            {
                "name": "台中一中館",
                "slug": "yizhong",
                "address": "台中市北區錦新街18號",
                "region": "中部",
                "phone": "+886-4-2201-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "快捷雙床房", "room_code": "CT",     "bed_type": "TWIN",  "has_window": True, "base_rate": 2000,"max_occupancy": 2,"amenities": [],"images": []},
                ],
            },
            {
                "name": "台中逢甲館",
                "slug": "fengchia",
                "address": "台中市西屯區逢甲路",
                "region": "中部",
                "phone": "+886-4-2452-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "快捷家庭房", "room_code": "SPF",    "bed_type": "FAMILY","has_window": True, "base_rate": 3200,"max_occupancy": 4,"amenities": [],"images": []},
                ],
            },
            {
                "name": "台中復興館",
                "slug": "fuxing",
                "address": "台中市北區復興路",
                "region": "中部",
                "phone": "+886-4-2202-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "快捷雙床房", "room_code": "CT",     "bed_type": "TWIN",  "has_window": True, "base_rate": 2000,"max_occupancy": 2,"amenities": [],"images": []},
                ],
            },
            {
                "name": "台中復興二館",
                "slug": "fuxing2",
                "address": "台中市北區復興路二段",
                "region": "中部",
                "phone": "+886-4-2202-6699",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "快捷雙床房", "room_code": "CT",     "bed_type": "TWIN",  "has_window": True, "base_rate": 2000,"max_occupancy": 2,"amenities": [],"images": []},
                ],
            },
            {
                "name": "高雄愛河館",
                "slug": "loveriver",
                "address": "高雄市鹽埕區七賢三路278號",
                "region": "南部",
                "phone": "+886-7-521-5566",
                "check_in_time": "15:00",
                "check_out_time": "11:00",
                "images": [],
                "room_types": [
                    {"name": "純捷雙人房", "room_code": "EXP-NW","bed_type": "DOUBLE","has_window": False,"base_rate": 1800,"max_occupancy": 2,"amenities": [],"images": []},
                    {"name": "快捷家庭房", "room_code": "SPF",    "bed_type": "FAMILY","has_window": True, "base_rate": 3200,"max_occupancy": 4,"amenities": [],"images": []},
                ],
            },
        ],
    },
]


def get_or_create(db, model, defaults=None, **kwargs):
    obj = db.query(model).filter_by(**kwargs).first()
    created = False
    if not obj:
        params = {**kwargs, **(defaults or {})}
        obj = model(**params)
        db.add(obj)
        db.flush()
        created = True
    return obj, created


def run():
    db = SessionLocal()
    try:
        # ── Tenant ────────────────────────────────────────────────────────────
        tenant, _ = get_or_create(
            db, Tenant,
            slug="checkinn",
            defaults={
                "name": "雀客旅館集團",
                "contact_email": "info@checkinn.com.tw",
                "is_active": True,
            },
        )
        print(f"Tenant: {tenant.name} (id={tenant.id})")

        for brand_data in BRANDS:
            # ── Brand ──────────────────────────────────────────────────────────
            brand, _ = get_or_create(
                db, Brand,
                slug=brand_data["slug"],
                tenant_id=tenant.id,
                defaults={
                    "name": brand_data["name"],
                    "is_active": True,
                },
            )
            print(f"  Brand: {brand.name}")

            for h_data in brand_data["hotels"]:
                # ── Hotel ──────────────────────────────────────────────────────
                hotel, h_created = get_or_create(
                    db, Hotel,
                    slug=h_data["slug"],
                    tenant_id=tenant.id,
                    defaults={
                        "brand_id":       brand.id,
                        "name":           h_data["name"],
                        "address":        h_data.get("address"),
                        "region":         h_data.get("region"),
                        "phone":          h_data.get("phone"),
                        "license_number": h_data.get("license_number"),
                        "check_in_time":  h_data.get("check_in_time"),
                        "check_out_time": h_data.get("check_out_time"),
                        "is_active":      True,
                    },
                )
                print(f"    Hotel: {hotel.name} (created={h_created})")

                if h_created:
                    for i, url in enumerate(h_data.get("images", [])):
                        db.add(HotelImage(hotel_id=hotel.id, url=url, sort_order=i))

                    for a in COMMON_AMENITIES + h_data.get("extra_amenities", []):
                        db.add(HotelAmenity(hotel_id=hotel.id, name=a["name"], category=a.get("category")))

                for rt_data in h_data.get("room_types", []):
                    # ── RoomType ───────────────────────────────────────────────
                    rt, rt_created = get_or_create(
                        db, RoomType,
                        name=rt_data["name"],
                        hotel_id=hotel.id,
                        defaults={
                            "room_code":     rt_data.get("room_code"),
                            "bed_type":      rt_data.get("bed_type"),
                            "has_window":    rt_data.get("has_window", True),
                            "size_sqm":      rt_data.get("size_sqm"),
                            "base_rate":     rt_data["base_rate"],
                            "max_occupancy": rt_data.get("max_occupancy", 2),
                            "description":   rt_data.get("description"),
                        },
                    )

                    if rt_created:
                        for i, url in enumerate(rt_data.get("images", [])):
                            db.add(RoomTypeImage(room_type_id=rt.id, url=url, sort_order=i))

                        for a in ROOM_AMENITIES_BASE + rt_data.get("amenities", []):
                            db.add(RoomTypeAmenity(room_type_id=rt.id, name=a["name"], category=a.get("category")))

        # ── Rooms ─────────────────────────────────────────────────────────────
        BRAND_FLOORS = {
            'select':  range(2, 7),   # 5 floors
            'hotel':   range(2, 8),   # 6 floors
            'express': range(2, 6),   # 4 floors
        }
        ROOMS_PER_RT = 2

        room_count = 0
        for brand_data in BRANDS:
            brand = db.query(Brand).filter_by(slug=brand_data['slug'], tenant_id=tenant.id).first()
            floors = BRAND_FLOORS[brand_data['slug']]
            for h_data in brand_data['hotels']:
                hotel = db.query(Hotel).filter_by(slug=h_data['slug'], tenant_id=tenant.id).first()
                rts = db.query(RoomType).filter_by(hotel_id=hotel.id).all()
                for floor in floors:
                    seq = 1
                    for rt in rts:
                        for _ in range(ROOMS_PER_RT):
                            number = f"{floor}{seq:02d}"
                            exists = db.query(Room).filter_by(hotel_id=hotel.id, number=number).first()
                            if not exists:
                                db.add(Room(
                                    hotel_id=hotel.id,
                                    number=number,
                                    floor=floor,
                                    room_type_id=rt.id,
                                    status=RoomStatus.AVAILABLE,
                                ))
                                room_count += 1
                            seq += 1

        db.commit()
        print(f"\n完成！資料已匯入。新增房間 {room_count} 間。")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run()
