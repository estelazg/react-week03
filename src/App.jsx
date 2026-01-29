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

  // ✅ 副圖 input 只負責「改值 + 自動長一格」
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

      return { ...prev, imagesUrl: newImagesUrl };
    });
  };

  const handleAddImage = () => {
    setTemplateProduct((prev) => {
      if (prev.imagesUrl.length >= 5) return prev;
      return {
        ...prev,
        imagesUrl: [...prev.imagesUrl, ""],
      };
    });
  };

  const handleRemoveImage = () => {
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
      ).toUTCString()}; path=/`;

      axios.defaults.headers.common.Authorization = token;

      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
    }
  };

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
        imagesUrl: templateProduct.imagesUrl.filter((url) => url !== ""),
      },
    };

    try {
      await axios[method](url, productData);
      getProducts();
      closeModal();
    } catch (error) {}
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      getProducts();
      closeModal();
    } catch (error) {}
  };

  const getProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(res.data.products);
    } catch (error) {}
  };

  const checkLogin = async () => {
    try {
      await axios.post(`${API_BASE}/api/user/check`);
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
    }
  };

  useEffect(() => {
    productModalInstance.current = new bootstrap.Modal(
      productModalRef.current,
      { keyboard: false },
    );

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    if (token) {
      axios.defaults.headers.common.Authorization = token;
      checkLogin();
    }
  }, []);

  // ✅ 關鍵修正：補一格空的副圖 input
  const openModal = (type, item = INITIAL_TEMPLATE_DATA) => {
    setModalType(type);

    let images = Array.isArray(item.imagesUrl) ? [...item.imagesUrl] : [];

    if (images.length === 0) {
      images.push("");
    } else if (images.length < 5 && images[images.length - 1] !== "") {
      images.push("");
    }

    setTemplateProduct({
      ...INITIAL_TEMPLATE_DATA,
      ...item,
      imagesUrl: images,
    });

    productModalInstance.current.show();
  };

  const closeModal = () => {
    productModalInstance.current.hide();
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
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
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

      {/* Modal */}
      <div className="modal fade" ref={productModalRef}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-body">
              {templateProduct.imagesUrl.map((url, index) => (
                <div key={index} className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={url}
                    onChange={(e) =>
                      handleImageUrlChange(index, e.target.value)
                    }
                  />
                  {url && <img className="img-fluid mt-2" src={url} alt="" />}
                </div>
              ))}

              {templateProduct.imagesUrl.length < 5 && (
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={handleAddImage}
                >
                  新增圖片
                </button>
              )}

              {templateProduct.imagesUrl.length > 1 && (
                <button
                  className="btn btn-outline-danger w-100 mt-2"
                  onClick={handleRemoveImage}
                >
                  刪除圖片
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
