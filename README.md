# Book_Store_Demo

## Chức năng chính

Book_Store_Demo là một ứng dụng mô tả quản lý cửa hàng sách, cung cấp các chức năng cơ bản như:
- CRUD (Tạo, Đọc, Cập nhật, Xóa).
- Xác thực, phân quyền, và kiểm tra dữ liệu.
- Tải lên, tải xuống tệp, phân trang.
- Gửi email.
- Xử lý thanh toán với Stripe.
- Xuất hóa đơn.

## Công nghệ

Ứng dụng được xây dựng bằng các công nghệ sau:
- **MVC**: Kiến trúc phần mềm.
- **Node.js**: Nền tảng chạy JavaScript phía máy chủ.
- **Express.js**: Framework để xây dựng API.
- **MongoDB**: Cơ sở dữ liệu NoSQL để lưu trữ dữ liệu.
- **Mongoose**: Thư viện để làm việc với MongoDB.
- **EJS**: Template engine để render giao diện.
- **Session và Cookies**: Lưu trữ dữ liệu tạm thời về người dùng.

## Thư viện

Các thư viện chính được sử dụng trong dự án:
- **dotenv**: Quản lý biến môi trường.
- **body-parser**: Xử lý dữ liệu từ request.
- **bcrypt**: Mã hóa mật khẩu.
- **nodemon**: Tự động tải lại server khi có thay đổi.
- **multer**: Xử lý dữ liệu ảnh jpg, jpeg, png.
- **stripe**: Xử lý thanh toán.
- **pdfkit**: Các thao tác với file .pdf.

## Cách cài đặt

1. Clone repository:
    ```bash
    git clone https://github.com/your-repo/Book_Store_Demo.git
    cd Book_Store_Demo
    ```

2. Cài đặt các phụ thuộc:
    ```bash
    npm install
    ```

3. Tạo file `.env` và cấu hình các biến môi trường:
    ```env
    PORT=3000
    MONGO_URI=your_mongodb_connection_string
    STRIPE_SK
    STRIPE_PK
    ```

4. Chạy ứng dụng:
    ```bash
    npm start
    ```

5. Truy cập ứng dụng tại `http://localhost:3000`.

## Đề xuất tính năng mới

- Tích hợp các nền tảng thanh toán nội địa như VNPay, MoMo,...
