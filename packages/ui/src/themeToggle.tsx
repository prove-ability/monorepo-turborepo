"use client";

import { useTheme } from "next-themes";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { useMounted } from "@repo/hooks";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // useMounted 훅을 사용해 마운트 전에는 렌더링하지 않도록 처리 (하이드레이션 오류 방지)
  if (!mounted) {
    return null;
  }

  const isDarkMode = theme === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconButton
        sx={{ ml: 1 }}
        onClick={() => setTheme(isDarkMode ? "light" : "dark")}
        color="inherit"
      >
        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
}
