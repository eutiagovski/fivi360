import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "@mui/material/styles";
import { dashboardTheme } from "./dashboardTheme";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={dashboardTheme}>
      <AuthContextProvider>

        <App />
      </AuthContextProvider>

      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
