# ลอยกระทงออนไลน์

เลือกกระทง → ใส่ชื่อและคำอธิษฐาน → ลอย 30 วินาที → รับเลขมงคล 2 หลัก
กระทงของทุกคนเก็บไว้ใน Cloud Firestore และลอยให้คนอื่นเห็นแบบ realtime

เว็บเป็น HTML / CSS / JS ล้วน (Firebase โหลดจาก CDN) จึง deploy ขึ้น GitHub Pages ได้ทันที ไม่ต้อง build

## รันบนเครื่อง

```powershell
python -m http.server 5173
```

แล้วเปิด http://localhost:5173 (ต้องเปิดผ่าน server เพราะใช้ ES modules เปิดไฟล์ตรง ๆ ไม่ได้)

## ตั้งค่า Firestore (ครั้งแรก)

Firebase Console → โปรเจกต์ `loykratong-a0499` → **Firestore Database** → แท็บ **Rules**
→ วางเนื้อหาจาก [firestore.rules](firestore.rules) → **Publish**

## โครงสร้างข้อมูล

collection `kratongs` — แต่ละเอกสารมี `name`, `wish`, `type` (banana / lotus / bread / marigold / person),
`lucky` (เลข 2 หลัก) และ `createdAt` (เวลาเซิร์ฟเวอร์) เว็บฟัง 30 ใบล่าสุดแบบ realtime
ใครลอยกระทงใหม่ ทุกคนที่เปิดเว็บอยู่จะเห็นลอยมาทันที

รูปหน้าของกระทงรูปคนไม่ถูกบันทึกขึ้น Firebase: แสดงเฉพาะบนเครื่องคนที่อัปโหลด คนอื่นเห็นหน้าการ์ตูน

## ไฟล์

- `index.html` — หน้าเว็บ
- `style.css` — ฉากแม่น้ำ กระทง แอนิเมชัน
- `app.js` — flow ผู้ใช้ และกระทงลอยบนแม่น้ำ
- `themes.js` — พื้นหลัง 4 แบบ (แม่น้ำ, โคมลอย, โบราณสถาน, เมือง)
- `effects.js` — เอฟเฟกต์สุ่มตอนลอย (โคมลอย, พลุ, ดาวตก, หิ่งห้อย, ปลากระโดด) และกลีบดอกไม้
- `firebase.js` — เชื่อม Firebase (Firestore + Analytics)
- `firestore.rules` — กฎความปลอดภัยของ Firestore
