"use client";

import * as React from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";

export default function Providers({ children }: { children: React.ReactNode }) {
  // 기본 라이트 테마 사용
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
        },
      }),
    []
  );

  return (
    <MuiThemeProvider theme={theme}>
      {/* <CssBaseline /> */}
      {children}
    </MuiThemeProvider>
  );
}
