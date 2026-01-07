# Movie Recommendation System (Hệ thống Gợi ý Phim)

Dự án Web App gợi ý phim sử dụng kiến trúc Microservices, bao gồm Frontend (React), Backend (Node.js/Express), Recommender Service (Python/Node), MongoDB và Redis. Dự án được đóng gói hoàn chỉnh bằng Docker.

## Yêu cầu cài đặt (Prerequisites)

Trước khi bắt đầu, máy tính của bạn cần cài đặt sẵn:

1.  **Docker Desktop** (bao gồm Docker Compose).
2.  **MongoDB Compass** (để import dữ liệu phim mẫu).

---

## Hướng dẫn cài đặt & Chạy dự án

### Bước 1: Khởi chạy hệ thống

Mở terminal (CMD/Powershell/Terminal) tại thư mục gốc của dự án (nơi chứa file `docker-compose.yml`) và chạy lệnh sau:

    docker compose up -d

*Lệnh này sẽ tự động tải các image cần thiết và khởi tạo 5 containers: Server, Client, Recommender, MongoDB, và Redis.*

### Bước 2: Import dữ liệu phim (Bắt buộc)

Hệ thống cần dữ liệu ban đầu để hiển thị phim và chạy thuật toán gợi ý. Hãy làm theo các bước sau:

1.  **Tải file dữ liệu:**

    https://drive.google.com/file/d/17V9tT70j9M1TFvEVhI2NZYW-DXONv7y3/view?usp=sharing

2.  **Mở MongoDB Compass và kết nối:**
    Sử dụng Connection String sau (đã cấu hình tài khoản trong Docker):

        mongodb://quangtan:quangtan@localhost:27017/

3.  **Thực hiện Import:**
    * Trong MongoDB Compass, tìm hoặc tạo database tên: **`movie-recsys`**
    * Tạo collection tên: **`movies`**
    * Chọn collection `movies` vừa tạo -> Nhấn nút **Import Data** (hoặc chọn tab *Documents* -> *Add Data* -> *Import JSON or CSV file*).
    * Chọn file JSON bạn vừa tải và nhấn **Import**.

---

## Truy cập ứng dụng

Sau khi các container đã chạy (kiểm tra bằng lệnh `docker ps`) và data đã được import:

* **Web App (Frontend):** http://localhost:5173
* **API Server:** http://localhost:5000

### Tài khoản Demo

Sử dụng tài khoản có sẵn dưới đây để đăng nhập và trải nghiệm đầy đủ tính năng:

* **Email:** `ngophuctan1407@gmail.com`
* **Password:** `hello123`

---

## Cấu trúc Services (Docker)

Hệ thống gồm 5 services chính được định nghĩa trong `docker-compose.yml`:

| Service | Container Name | Port | Mô tả |
| :--- | :--- | :--- | :--- |
| **client** | `client_container` | 5173 | Giao diện người dùng (ReactJS + Vite). |
| **server** | `server_container` | 5000 | Backend API Gateway (Node.js/Express). |
| **recommender** | `recommender_container` | 8000 | Service tính toán gợi ý phim (Hybrid Filtering). |
| **mongodb** | `mongodb_container` | 27017 | Database lưu trữ phim & user. |
| **redis** | `redis_container` | 6379 | Caching & Rate Limiting. |

---

## Testing

Dự án đã tích hợp sẵn Unit Test và Integration Test. Để chạy kiểm thử, bạn thực hiện lệnh sau trong terminal:

    docker exec -it server_container npm test

**Phạm vi test:**

* **Unit Test:** Kiểm tra logic xử lý lỗi của Recommendation Service (ví dụ: fallback khi service AI bị down).
* **Integration Test:** Kiểm tra luồng API thực tế (ví dụ: API `/discover` hoạt động đúng với Redis Cache).

---

## Troubleshooting (Gỡ lỗi thường gặp)

1.  **Lỗi không kết nối được Database:**
    * Kiểm tra container MongoDB có đang chạy không bằng lệnh: `docker ps`
    * Đảm bảo bạn dùng đúng user/pass khi kết nối Compass: `quangtan`/`quangtan`

2.  **Trang web trắng hoặc không hiển thị phim:**
    * Đảm bảo bạn đã thực hiện **Bước 2 (Import Data)** thành công.
    * Kiểm tra log của server để xem lỗi chi tiết: `docker logs server_container`

3.  **Cập nhật code mới:**
    * Nếu bạn sửa code trong server hoặc client, hãy chạy lệnh sau để build lại container:

        docker compose up -d --build
