import { createContext, useEffect, useState } from "react";
import {
  TUserContext,
  TUserDataToken,
  TUserName,
  TUser,
  TUserProvidersProps,
  TErrorResponse,
  TUserMail,
  TJwtDecode,
  TAddressResponse,
  TAddressPartial,
} from "./@types";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { TLoginData } from "../../Components/Forms/LoginForm/validator";
import { api } from "../../Services/api";
import jwt_decode from "jwt-decode";
import { AxiosError } from "axios";
import { useModal } from "../../Hooks";
import { TUserRegisterData } from "../../Components/Forms/RegisterForm/validator";
import { TUserSales } from "../CarContext/@types";

const UserContext = createContext({} as TUserContext);

const UserProvider = ({ children }: TUserProvidersProps) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<TUserName | null>(null);
  const [user, setUser] = useState<TUser | null>(null);
  const [userSales, setUserSales] = useState<TUserSales[]>([]);

  const { setModal } = useModal();

  const userLogin = async (data: TLoginData) => {
    try {
      const response = await api.post("/users/login", data);
      const { token } = response.data;

      const tokenDecoded: TJwtDecode = jwt_decode(token);

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      localStorage.setItem("frontEndMotors:token", token);
      toast.success("Login realizado com sucesso!");

      retrieveUser(tokenDecoded.userId);

      tokenDecoded.role === "seller" ? navigate("/dashboard") : navigate("/");
    } catch (error) {
      toast.error("E-mail ou senha inválido(s)!");
      console.log(error);
    }
  };

  const userRegister = async (data: TUserRegisterData) => {
    try {
      await api.post("/users", data);
      const token = localStorage.getItem("frontEndMotors:token");

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      toast.success("Usuário cadastrado com sucesso!");
      navigate("dashboard");
    } catch (error) {
      toast.error("Cadastro inválido!");
      console.log(error);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("frontEndMotors:token");
    navigate("/");
    setUser(null);
  };

  const retrieveUser = async (id: string) => {
    try {
      const response = await api.get(`salesAd/users/${id}`);
      setUserName({
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
      });
      setUser(response.data.user);
      setUserSales(response.data.data);
    } catch (error) {
      const currentError = error as AxiosError<TErrorResponse>;
      toast.error(currentError.response?.data.message);
      logoutUser();
      console.log(error);
    }
  };

  const retrieveProfileViewUser = async (
    id: string,
    setState: React.Dispatch<React.SetStateAction<TUser | null>>,
    setState2: React.Dispatch<React.SetStateAction<TUserSales[]>>
  ) => {
    try {
      const response = await api.get(`salesAd/users/${id}`);
      setState(response.data.user);
      setState2(response.data.data);
    } catch (error) {
      const currentError = error as AxiosError<TErrorResponse>;
      toast.error(currentError.response?.data.message);

      console.log(error);
    }
  };

  const recoverPassword = async (data: TUserMail) => {
    try {
      await api.post("/recoverPass", data);
      setModal(null);
      navigate("/login");
      toast.success("Senha enviado por e-mail");
    } catch (error) {
      const currentError = error as AxiosError<TErrorResponse>;
      toast.error(currentError.response?.data.message);
      console.log(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("frontEndMotors:token") || null;
    const userData = token ? jwt_decode<TUserDataToken>(token) : null;
    if (!userData) {
      return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    retrieveUser(userData?.sub!);
  }, []);

  const changeUserAddress = async (data: TAddressPartial) => {
    const token = localStorage.getItem("frontEndMotors:token") || null;
    try {
      const changeAddress = await api.patch<TAddressResponse>(
        "/address",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      user!.address = changeAddress.data;

      setUser(user);

      toast.success("Endereço atualizado com sucesso");
    } catch (error) {
      console.log(error);
      toast.error("Não foi possível atualizar o endereço");
    }
  };

  return (
    <UserContext.Provider
      value={{
        userName,
        user,
        userLogin,
        logoutUser,
        recoverPassword,
        userRegister,
        setUser,
        retrieveUser,
        changeUserAddress,
        retrieveProfileViewUser,
        userSales,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
