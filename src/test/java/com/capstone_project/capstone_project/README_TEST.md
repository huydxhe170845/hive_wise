# Unit Tests cho HiveWise KMS

## Tổng quan

Dự án này bao gồm các unit test cho các service chính của hệ thống HiveWise Knowledge Management System (KMS). Các test được viết bằng JUnit 5 và Mockito để đảm bảo tính độc lập và hiệu quả.

## Cấu trúc Test

### 1. Service Layer Tests

#### 1.1 AuthServiceTest
**File:** `src/test/java/com/capstone_project/capstone_project/service/AuthServiceTest.java`

**Chức năng được test:**
- Đăng ký tài khoản (signup)
- Xác thực tài khoản (verify account)
- Đăng nhập (login)
- Gửi lại email xác thực (resend verification email)

**Test cases chính:**
- ✅ Đăng ký thành công
- ❌ Đăng ký với email đã tồn tại
- ❌ Đăng ký với username đã tồn tại
- ❌ Đăng ký với password không khớp
- ✅ Xác thực tài khoản thành công
- ❌ Xác thực với token không tồn tại
- ❌ Xác thực với token đã hết hạn
- ✅ Đăng nhập thành công
- ❌ Đăng nhập với tài khoản không tồn tại
- ❌ Đăng nhập với mật khẩu sai
- ❌ Đăng nhập với tài khoản chưa kích hoạt

#### 1.2 UserServiceTest
**File:** `src/test/java/com/capstone_project/capstone_project/service/UserServiceTest.java`

**Chức năng được test:**
- Tìm kiếm user theo keyword
- Lấy danh sách tất cả users
- Đếm số lượng tài khoản
- Tìm user theo ID
- Cập nhật role và status của user
- Lấy danh sách roles

**Test cases chính:**
- ✅ Tìm kiếm user với keyword
- ✅ Tìm kiếm user với keyword rỗng/null
- ✅ Lấy tất cả users
- ✅ Đếm tổng số tài khoản
- ✅ Tìm user theo ID (tồn tại/không tồn tại)
- ✅ Cập nhật role user
- ✅ Cập nhật status user
- ✅ Lấy danh sách roles
- ✅ Đếm tài khoản active/inactive

#### 1.3 VaultServiceTest
**File:** `src/test/java/com/capstone_project/capstone_project/service/VaultServiceTest.java`

**Chức năng được test:**
- Tạo vault mới
- Cập nhật vault
- Xóa vault
- Tìm kiếm vault

**Test cases chính:**
- ✅ Tạo vault thành công
- ❌ Tạo vault với tên đã tồn tại
- ✅ Tạo vault với ảnh
- ✅ Cập nhật vault thành công
- ❌ Cập nhật vault không tồn tại
- ❌ Cập nhật vault với tên đã tồn tại

#### 1.4 EmailServiceTest
**File:** `src/test/java/com/capstone_project/capstone_project/service/EmailServiceTest.java`

**Chức năng được test:**
- Gửi email xác thực
- Gửi email chào mừng
- Gửi email reset password
- Gửi email thông báo

**Test cases chính:**
- ✅ Gửi email xác thực thành công
- ✅ Gửi email chào mừng thành công
- ✅ Gửi email reset password thành công
- ✅ Gửi email thông báo thành công
- ❌ Gửi email với địa chỉ null/rỗng/không hợp lệ

#### 1.5 NotificationServiceTest
**File:** `src/test/java/com/capstone_project/capstone_project/service/NotificationServiceTest.java`

**Chức năng được test:**
- Tạo notification
- Lấy danh sách notification
- Đánh dấu đã đọc
- Xóa notification

**Test cases chính:**
- ✅ Tạo notification thành công
- ❌ Tạo notification với user không tồn tại
- ✅ Lấy notification theo user
- ✅ Lấy notification chưa đọc
- ✅ Đánh dấu đã đọc
- ✅ Xóa notification
- ✅ Đếm số notification

#### 1.6 Other Service Tests
**Files:** 
- `FolderServiceTest.java`
- `TagServiceTest.java`
- `RatingServiceTest.java`
- `UserVaultRoleServiceTest.java`
- `KnowledgeViewServiceTest.java`
- `VisitServiceTest.java`
- `CommentServiceTest.java`
- `KnowledgeItemServiceTest.java`

**Chức năng được test:**
- Quản lý folder và tag
- Đánh giá và bình luận
- Phân quyền user trong vault
- Theo dõi lượt xem và truy cập
- Quản lý knowledge items

### 2. Controller Layer Tests

#### 2.1 AuthenticationControllerTest
**File:** `src/test/java/com/capstone_project/capstone_project/controller/AuthenticationControllerTest.java`

**Chức năng được test:**
- Thay đổi mật khẩu
- Thêm mật khẩu
- Cập nhật profile
- Xác thực tài khoản
- Reset mật khẩu

**Test cases chính:**
- ✅ Thay đổi mật khẩu thành công
- ❌ Thay đổi mật khẩu với dữ liệu không hợp lệ
- ✅ Thêm mật khẩu thành công
- ❌ Thêm mật khẩu với dữ liệu không hợp lệ
- ✅ Cập nhật profile thành công
- ❌ Cập nhật profile với dữ liệu không hợp lệ
- ✅ Xác thực tài khoản với token hợp lệ
- ❌ Xác thực tài khoản với token không hợp lệ
- ✅ Reset mật khẩu với token hợp lệ
- ❌ Reset mật khẩu với token không hợp lệ

#### 2.2 NotificationControllerTest
**File:** `src/test/java/com/capstone_project/capstone_project/controller/NotificationControllerTest.java`

**Chức năng được test:**
- Lấy danh sách thông báo
- Lấy số lượng thông báo chưa đọc
- Đánh dấu đã đọc/chưa đọc

**Test cases chính:**
- ✅ Lấy danh sách thông báo thành công
- ❌ Lấy danh sách thông báo khi service lỗi
- ✅ Lấy số lượng thông báo chưa đọc
- ❌ Lấy số lượng thông báo khi service lỗi
- ✅ Đánh dấu đã đọc thành công
- ❌ Đánh dấu đã đọc khi notification không tồn tại
- ✅ Đánh dấu chưa đọc thành công
- ❌ Đánh dấu chưa đọc khi notification không tồn tại

### 3. Validation Layer Tests

#### 3.1 EmailValidatorTest
**File:** `src/test/java/com/capstone_project/capstone_project/validation/EmailValidatorTest.java`

**Chức năng được test:**
- Xác thực định dạng email

**Test cases chính:**
- ✅ Email hợp lệ với các định dạng khác nhau
- ❌ Email null/rỗng/không hợp lệ
- ❌ Email thiếu ký tự @
- ❌ Email có nhiều ký tự @
- ❌ Email thiếu domain
- ❌ Email có ký tự không hợp lệ
- ❌ Email có khoảng trắng

#### 3.2 PasswordValidatorTest
**File:** `src/test/java/com/capstone_project/capstone_project/validation/PasswordValidatorTest.java`

**Chức năng được test:**
- Xác thực độ mạnh mật khẩu

**Test cases chính:**
- ✅ Mật khẩu hợp lệ với đầy đủ yêu cầu
- ❌ Mật khẩu null/rỗng
- ❌ Mật khẩu quá ngắn/quá dài
- ❌ Mật khẩu thiếu chữ hoa/chữ thường
- ❌ Mật khẩu thiếu số/ký tự đặc biệt
- ❌ Mật khẩu có khoảng trắng

#### 3.3 UsernameValidatorTest
**File:** `src/test/java/com/capstone_project/capstone_project/validation/UsernameValidatorTest.java`

**Chức năng được test:**
- Xác thực định dạng username

**Test cases chính:**
- ✅ Username hợp lệ với các ký tự cho phép
- ❌ Username null/rỗng
- ❌ Username quá ngắn/quá dài
- ❌ Username có ký tự không hợp lệ
- ❌ Username có khoảng trắng

### 4. Exception Tests

#### 4.1 FieldValidationExceptionTest
**File:** `src/test/java/com/capstone_project/capstone_project/exception/FieldValidationExceptionTest.java`

**Chức năng được test:**
- Tạo và xử lý exception validation

**Test cases chính:**
- ✅ Tạo exception với field và message hợp lệ
- ✅ Tạo exception với field/message null/rỗng
- ✅ Lấy field và message từ exception
- ✅ Exception kế thừa từ RuntimeException
- ✅ Exception có thể throw và catch

### 5. Utility Tests

#### 5.1 JwtUtilTest
**File:** `src/test/java/com/capstone_project/capstone_project/util/JwtUtilTest.java`

**Chức năng được test:**
- Tạo JWT token
- Xác thực JWT token
- Trích xuất thông tin từ token

**Test cases chính:**
- ✅ Tạo token thành công
- ❌ Tạo token với userId null/rỗng
- ✅ Xác thực token hợp lệ
- ❌ Xác thực token không hợp lệ
- ✅ Trích xuất userId từ token
- ✅ Kiểm tra token hết hạn

## Cách chạy Test

### Chạy tất cả test
```bash
mvn test
```

### Chạy test cụ thể
```bash
# Chạy test cho Service Layer
mvn test -Dtest=AuthServiceTest
mvn test -Dtest=UserServiceTest
mvn test -Dtest=VaultServiceTest
mvn test -Dtest=NotificationServiceTest

# Chạy test cho Controller Layer
mvn test -Dtest=AuthenticationControllerTest
mvn test -Dtest=NotificationControllerTest

# Chạy test cho Validation Layer
mvn test -Dtest=EmailValidatorTest
mvn test -Dtest=PasswordValidatorTest
mvn test -Dtest=UsernameValidatorTest

# Chạy test cho Exception
mvn test -Dtest=FieldValidationExceptionTest

# Chạy test cho Utility
mvn test -Dtest=JwtUtilTest
mvn test -Dtest=TokenGeneratorTest
```

### Chạy test với coverage
```bash
mvn test jacoco:report
```

## Cấu trúc Test Pattern

Mỗi test method tuân theo pattern **Arrange-Act-Assert (AAA)**:

```java
@Test
void methodName_Scenario_ExpectedResult() {
    // Arrange - Chuẩn bị dữ liệu và mock
    when(repository.findById("id")).thenReturn(Optional.of(entity));
    
    // Act - Thực hiện hành động cần test
    Result result = service.methodName("id");
    
    // Assert - Kiểm tra kết quả
    assertNotNull(result);
    assertEquals(expectedValue, result.getValue());
    verify(repository).findById("id");
}
```

## Mocking Strategy

- **Repository Layer**: Mock tất cả repository để tránh truy cập database
- **External Services**: Mock các service bên ngoài như EmailService
- **Dependencies**: Sử dụng `@InjectMocks` để inject các mock vào service

## Best Practices

1. **Test Isolation**: Mỗi test method độc lập, không phụ thuộc vào test khác
2. **Descriptive Names**: Tên test method mô tả rõ scenario và expected result
3. **Single Responsibility**: Mỗi test chỉ test một chức năng cụ thể
4. **Edge Cases**: Test cả happy path và error cases
5. **Mock Verification**: Verify các mock method được gọi đúng cách

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 70%
- **Method Coverage**: > 90%

## Troubleshooting

### Lỗi thường gặp:

1. **Mock not found**: Kiểm tra annotation `@Mock` và `@InjectMocks`
2. **Method not found**: Kiểm tra tên method và signature
3. **NullPointerException**: Kiểm tra setup của test data

### Debug Test:
```bash
# Chạy test với debug log
mvn test -Dtest=AuthServiceTest -Dlogging.level.com.capstone_project=DEBUG
```

## Mở rộng Test

Để thêm test mới:

1. Tạo test method với naming convention: `methodName_Scenario_ExpectedResult`
2. Sử dụng AAA pattern
3. Mock các dependencies cần thiết
4. Test cả success và failure cases
5. Verify các mock calls

## Test Coverage Summary

### Tổng quan Test Coverage
- **Service Layer**: 13 test classes (Auth, User, Vault, Notification, Folder, Tag, Rating, UserVaultRole, KnowledgeView, Visit, Comment, KnowledgeItem, Email)
- **Controller Layer**: 2 test classes (Authentication, Notification)
- **Validation Layer**: 3 test classes (Email, Password, Username)
- **Exception Layer**: 1 test class (FieldValidationException)
- **Utility Layer**: 2 test classes (JwtUtil, TokenGenerator)

### Tổng số Test Cases
- **Service Tests**: ~150+ test cases
- **Controller Tests**: ~25+ test cases
- **Validation Tests**: ~80+ test cases
- **Exception Tests**: ~10+ test cases
- **Utility Tests**: ~30+ test cases

**Tổng cộng**: ~300+ test cases

### Coverage Goals
- **Line Coverage**: > 80%
- **Branch Coverage**: > 70%
- **Method Coverage**: > 90%

## Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```
