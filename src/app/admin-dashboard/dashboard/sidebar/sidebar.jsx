"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Logout } from "@/app/Store/Slice";
import Image from "next/image";
import { FaFileInvoice } from "react-icons/fa6";
import { FiMenu } from "react-icons/fi";
import { FaListOl } from "react-icons/fa";// MUI Imports
import { IoIosAddCircle } from "react-icons/io";
import { MdEmojiTransportation } from "react-icons/md";
import { FaCar } from "react-icons/fa";
import { GiCargoShip } from "react-icons/gi";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Divider,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ExpandLess,
  ExpandMore,
  AnalyticsOutlined,
} from "@mui/icons-material";

// Other Icon Imports
import {
  FaUsers,
  FaUserTie,
  FaBoxOpen,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import { MdHistory } from "react-icons/md";
import { PiBank, PiHandWithdraw } from "react-icons/pi";
import { BiCoinStack } from "react-icons/bi";
import { Hotel, PlaneLanding } from "lucide-react";

// Styled Components
const SidebarContainer = styled(Drawer)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: 280,
    boxSizing: "border-box",
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const Sidebar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const userRole = useSelector((state) => state?.auth?.role) ?? "admin";

  const toggleDropdown = (key) => {
    setOpenDropdowns((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const handleLogout = () => {
    dispatch(Logout());
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Admin Management",
      path: "/admin-dashboard/Admin-Management",
      icon: <FaUsers />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "User's Management",
      path: "/admin-dashboard/Agent-Management",
      icon: <FaUsers />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Main Management",
      icon: <FiMenu />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "Sea Ports", path: "/admin-dashboard/Sea-ports", icon: <Hotel />, roles: ["admin", "sub admin"] },
        { title: "Distributer's", path: "/admin-dashboard/distributers", icon: <Hotel />, roles: ["admin", "sub admin"] },
      ],
    },
    {
      title: "Invoices",
      icon: <FaFileInvoice  />,
      roles: ["admin", "sub admin"],
      subitems: [
        { title: "New Invoice", path: "/admin-dashboard/Invoice-Form/NewInvoice", icon: <IoIosAddCircle  />, roles: ["admin", "sub admin"] },
        { title: "Invoice's List", path: "/admin-dashboard/Invoice-Form", icon: <FaListOl />, roles: ["admin", "sub admin"] },
        { title: "Incomplete Invoices", path: "/admin-dashboard/Hotel-Management/Hotel-Booking", icon: <FaListOl />, roles: ["admin", "sub admin"] },
       ],
    },
    {
      title: "Veichle Management",
      path: "/admin-dashboard/Package-Management",
      icon: <FaCar />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Transport Management",
      path: "/admin-dashboard/Transport-Management",
      icon: <MdEmojiTransportation  />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Cargo Management",
      path: "/admin-dashboard/Package-Management",
      icon: <GiCargoShip  />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Ledgers",
      path: "/admin-dashboard/Ledgers",
      icon: <MdHistory />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Bank Accounts",
      path: "/admin-dashboard/Bank-Accounts",
      icon: <PiBank />,
      roles: ["admin", "sub admin"],
    },
    {
      title: "Settings",
      path: "/admin-dashboard/settings",
      icon: <FaCog />,
      roles: ["admin"],
    },
  ];

  return (
    <SidebarContainer
      variant="permanent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <LogoContainer>
        <Image
          src="/logo/logo1.jpg"
          width={80}
          height={80}
          alt="logo"
          style={{ transition: "all 0.3s ease" }}
        />
      </LogoContainer>

      <Divider />

      <List sx={{ padding: 1 }}>
        {/* Analytics Item */}
        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href="/admin-dashboard/Analytics"
            sx={{
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ListItemIcon>
              <AnalyticsOutlined />
            </ListItemIcon>
            <ListItemText
              primary="Analytics"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItemButton>
        </ListItem>

        {/* Menu Items */}
        {menuItems.map((item) =>
          item.roles.includes(userRole) ? (
            <Box key={item.title}>
              <ListItem disablePadding>
                <Tooltip title={item.title} placement="right" arrow>
                  <ListItemButton
                    onClick={() =>
                      item.path ? router.push(item.path) : toggleDropdown(item.title)
                    }
                    sx={{
                      borderRadius: 1,
                      "&:hover": { bgcolor: "action.hover" },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                    {item.subitems && (
                      openDropdowns[item.title] ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {/* Submenu */}
              {item.subitems && (
                <Collapse
                  in={openDropdowns[item.title]}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    {item.subitems.map((subitem) =>
                      subitem.roles.includes(userRole) ? (
                        <ListItem key={subitem.title} disablePadding>
                          <ListItemButton
                            component="a"
                            href={subitem.path}
                            sx={{
                              borderRadius: 1,
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {subitem.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={subitem.title}
                              primaryTypographyProps={{ variant: "body2" }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ) : null
                    )}
                  </List>
                </Collapse>
              )}
            </Box>
          ) : null
        )}

        <Divider sx={{ my: 1 }} />

        {/* Logout Button */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
              color: "error.main",
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <FaSignOutAlt />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ variant: "body2" }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </SidebarContainer>
  );
};

export default Sidebar;