import { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  // 登入資料
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef(null);
  const productModalInstance = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTemplateProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUrlChange = (index, value) => {
    setTemplateProduct((prev) => {
      const newImagesUrl = [...prev.imagesUrl];
      newImagesUrl[index] = value;
      if (
        value !== "" &&
        index === newImagesUrl.length - 1 &&
        newImagesUrl.length < 5
      ) {
        newImagesUrl.push("");
      }
      if (
        value === "" &&
        index === newImagesUrl.length - 2 &&
        newImagesUrl.length > 1 &&
        newImagesUrl[newImagesUrl.length - 1] === ""
      ) {
        newImagesUrl.pop();
      }
      return { ...prev, imagesUrl: newImagesUrl };
    });
  };

  const handleAddImage = () => {
    setTemplateProduct((prev) => {
      const newImagesUrl = [...prev.imagesUrl];
      newImagesUrl.push("");
      return { ...prev, imagesUrl: newImagesUrl };
    });
  };

  const handleRemoveImage = (index) => {
    setTemplateProduct((prev) => {
      const newImagesUrl = [...prev.imagesUrl];
      newImagesUrl.pop();
      return { ...prev, imagesUrl: newImagesUrl };
    });
  };

  // 登入
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(
        expired,
      ).toUTCString()}; path=/;`;
      axios.defaults.headers.common.Authorization = token;
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
      alert(error.response?.data?.message);
    }
  };

  // 新增產品
  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";

    if (modalType === "edit") {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
    }

    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: templateProduct.imagesUrl.filter(
          (url) => url && url.trim() !== "",
        ),
      },
    };

    try {
      await axios[method](url, productData);
      getProducts();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  // 刪除產品
  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      getProducts();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  // API 取得列表
  const getProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(res.data.products);
    } catch (error) {
      console.log(error.response?.data?.message);
    }
  };

  const checkLogin = async () => {
    try {
      await axios.post(`${API_BASE}/api/user/check`);
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
      console.log(error.response?.data?.message);
    }
  };

  useEffect(() => {
    // 初始化 Bootstrap Modal
    productModalInstance.current = new bootstrap.Modal(
      productModalRef.current,
      {
        keyboard: false,
      },
    );

    // 取得 cookie token
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    if (token) {
      axios.defaults.headers.common.Authorization = token;
      checkLogin();
    }
  }, []);

  // Modal 控制
  const openModal = (type, item = INITIAL_TEMPLATE_DATA) => {
    setModalType(type);
    setTemplateProduct({
      ...INITIAL_TEMPLATE_DATA,
      ...item,
      imagesUrl: Array.isArray(item.imagesUrl) ? item.imagesUrl : [],
    });
    productModalInstance.current.show();
  };

  const closeModal = () => {
    productModalInstance.current.hide();
  };

  // Modal 確認按鈕
  const handleConfirm = async () => {
    if (modalType === "delete") {
      await deleteProduct(templateProduct.id);
    } else {
      await updateProduct(templateProduct.id);
    }
  };

  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <h1>請先登入</h1>
          <form className="form-floating" onSubmit={onSubmit}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                name="username"
                placeholder="name@example.com"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
              <label>Email</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <label>Password</label>
            </div>
            <button className="btn btn-primary mt-3 w-100">登入</button>
          </form>
        </div>
      ) : (
        <div className="container">
          <h2>產品列表</h2>
          <div className="text-end mt-4">
            <button
              className="btn btn-primary"
              onClick={() => openModal("create")}
            >
              建立新的產品
            </button>
          </div>
          <table className="table mt-3">
            <thead>
              <tr>
                <th>分類</th>
                <th>名稱</th>
                <th>原價</th>
                <th>售價</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td>{item.title}</td>
                  <td>{item.origin_price}</td>
                  <td>{item.price}</td>
                  <td className={item.is_enabled ? "text-success" : ""}>
                    {item.is_enabled ? "啟用" : "未啟用"}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => openModal("edit", item)}
                    >
                      編輯
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => openModal("delete", item)}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      <div className="modal fade" tabIndex="-1" ref={productModalRef}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div
              className={`modal-header ${
                modalType === "delete" ? "bg-danger" : "bg-dark"
              } text-white`}
            >
              <h5 className="modal-title">
                {modalType === "create" && "新增產品"}
                {modalType === "edit" && "編輯產品"}
                {modalType === "delete" && "刪除產品"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={closeModal}
              />
            </div>
            <div className="modal-body">
              {modalType === "delete" ? (
                <p className="fs-4">
                  確定要刪除{" "}
                  <span className="text-danger">{templateProduct.title}</span>{" "}
                  嗎？
                </p>
              ) : (
                <div className="row">
                  {/* 左側圖片 */}
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">主圖網址</label>
                      <input
                        type="text"
                        name="imageUrl"
                        className="form-control"
                        placeholder="請輸入圖片網址"
                        value={templateProduct.imageUrl}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    {templateProduct.imageUrl && (
                      <img
                        className="img-fluid mb-3"
                        src={templateProduct.imageUrl}
                        alt="主圖"
                      />
                    )}
                    {/* 副圖 */}
                    {templateProduct.imagesUrl.map((url, index) => (
                      <div key={index} className="mb-3">
                        <label className="form-label">
                          {" "}
                          副圖網址 {index + 1}{" "}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`圖片網址${index + 1}`}
                          value={url}
                          onChange={(e) =>
                            handleImageUrlChange(index, e.target.value)
                          }
                        />
                        {url && (
                          <img
                            className="img-fluid mt-2"
                            src={url}
                            alt={`副圖 ${index + 1}`}
                          />
                        )}
                      </div>
                    ))}
                    <div className="d-grid gap-2">
                      {templateProduct.imagesUrl.length < 5 &&
                        (templateProduct.imagesUrl.length === 0 ||
                          templateProduct.imagesUrl[
                            templateProduct.imagesUrl.length - 1
                          ] !== "") && (
                          <button
                            className="btn btn-outline-primary btn-sm d-block w-100"
                            onClick={handleAddImage}
                          >
                            新增圖片
                          </button>
                        )}
                      {templateProduct.imagesUrl.length >= 1 && (
                        <button
                          className="btn btn-outline-danger btn-sm d-block w-100"
                          onClick={handleRemoveImage}
                        >
                          刪除圖片
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 右側表單 */}
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label">標題</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        value={templateProduct.title}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">分類</label>
                        <input
                          type="text"
                          name="category"
                          className="form-control"
                          value={templateProduct.category}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">單位</label>
                        <input
                          type="text"
                          name="unit"
                          className="form-control"
                          value={templateProduct.unit}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">原價</label>
                        <input
                          type="number"
                          min="0"
                          name="origin_price"
                          className="form-control"
                          value={templateProduct.origin_price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">售價</label>
                        <input
                          type="number"
                          min="0"
                          name="price"
                          className="form-control"
                          value={templateProduct.price}
                          onChange={handleModalInputChange}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">產品描述</label>
                      <textarea
                        name="description"
                        className="form-control"
                        value={templateProduct.description}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">說明內容</label>
                      <textarea
                        name="content"
                        className="form-control"
                        value={templateProduct.content}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="is_enabled"
                        id="isEnabledProduct"
                        className="form-check-input"
                        checked={templateProduct.is_enabled}
                        onChange={handleModalInputChange}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="isEnabledProduct"
                      >
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={closeModal}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
