// components/MuiThemeProvider.tsx
"use client";

import * as React from "react";
import { useTheme, ThemeProvider as NextThemesProvider } from "next-themes";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

export default function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme(); // next-themes로부터 현재 테마를 받아옴 ('light' or 'dark')

  // 현재 테마에 맞는 MUI 테마 객체를 생성합니다.
  // useMemo를 사용해 테마가 변경될 때만 재생성되도록 최적화합니다.
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedTheme === "dark" ? "dark" : "light",
        },
      }),
    [resolvedTheme]
  );

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </NextThemesProvider>
  );
}
