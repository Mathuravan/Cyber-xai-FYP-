import { Link, Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

import ThemeToggle from "../ThemeToggle";

import "../../App.css";

import "../../styles/dashboard.css";



export default function DashboardLayout() {

  return (

    <div className="app dashboard-app">

      <Sidebar />



      <div className="main">

        <div className="theme-header-bar">

          <ThemeToggle />

        </div>



        <div className="workspace-content">

          <Outlet />

          <footer className="app-footer">
            <p>CyberXAI - Explainable Intrusion Detection Platform</p>

            <p className="app-footer-links">
              Quick Links:{" "}
              <Link to="/dashboard">Overview</Link>
              <span>|</span>
              <Link to="/dashboard/predict">Single Predict</Link>
              <span>|</span>
              <Link to="/dashboard/batch">Batch CSV</Link>
              <span>|</span>
              <Link to="/dashboard/logs">Logs</Link>
            </p>

            <p>
              Developed by Jeyakumar Mathuravan | Final Year Project
              Prototype | IIT / University of Westminster
            </p>
          </footer>

        </div>

      </div>

    </div>

  );

}


