import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "@/helper/Redux/Store";
import DefaultDashboardLayout from "@/layouts/DefaultDashboardLayout";
import GlobalLoader from "@/components/GlobalLoader";
import { AuthProvider, useAuth } from "@/helper/Context/AuthContext";
import { canAccessPath, getFirstAllowedPath } from "@/helper/accessControl";
import { readSelectedApp } from "@/helper/appName";
import "../styles/theme.scss";
import "../styles/Customized Styles/Customized.scss";

const PUBLIC_ROUTES = ["/", "/404", "/privacy-policy"];

// Paints the panel in the selected app's colours by setting data-app on <html>,
// which the accent variables in styles/Customized Styles/_app-theme.scss key off.
// PairEver has no overrides — it uses the defaults, so it looks exactly as before.
const AppThemeSync = () => {
  const router = useRouter();

  useEffect(() => {
    const sync = () => {
      const app = readSelectedApp();
      document.documentElement.setAttribute("data-app", app);
    };

    sync();
    // Switch App writes to localStorage and router.push()es, so re-read on every
    // navigation as well as on a change made in another tab.
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [router.asPath]);

  return null;
};

const PageFallback = () => (
  <div style={{ minHeight: "100vh", background: "#fff" }} />
);

const RouteGuard = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/");
      return;
    }

    if (isAuthenticated) {
      const hasSelectedApp = typeof window !== "undefined" && localStorage.getItem("selectedAdminApp");
      if (!hasSelectedApp && router.pathname !== "/select-app") {
        router.replace("/select-app");
        return;
      }
    }

    if (isAuthenticated && router.pathname === "/") {
      const hasSelectedApp = typeof window !== "undefined" && localStorage.getItem("selectedAdminApp");
      const nextPath = hasSelectedApp ? getFirstAllowedPath(user) : "/select-app";

      if (nextPath !== router.pathname) {
        router.replace(nextPath);
      }

      return;
    }

    if (
      isAuthenticated &&
      !isPublicRoute &&
      router.pathname !== "/select-app" &&
      !canAccessPath(user, router.pathname)
    ) {
      const nextPath = getFirstAllowedPath(user);

      if (nextPath !== router.pathname) {
        router.replace(nextPath);
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return <PageFallback />;
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.includes(router.pathname)) {
    return <PageFallback />;
  }

  if (
    isAuthenticated &&
    !PUBLIC_ROUTES.includes(router.pathname) &&
    !canAccessPath(user, router.pathname)
  ) {
    return <PageFallback />;
  }

  return children;
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const pageURL = process.env.baseURL + router.pathname;
  const title = "PairEver -  Admin Pannel";
  const description = "PairEver -  Admin Pannel";
  const keywords = "PairEver -  Admin Pannel";

  const Layout =
    Component.Layout ||
    (router.pathname.includes("dashboard")
      ? DefaultDashboardLayout
      : DefaultDashboardLayout);

  return (
    <Provider store={store}>
      <GlobalLoader />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content={keywords} />
        <link
          rel="shortcut icon"
          href="https://xdmindscom.s3.ap-south-1.amazonaws.com/appstore.png"
          type="image/x-icon"
        />
        <link rel="shortcut icon" href="/appstore.png" type="image/x-icon" />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="shortcut icon" href="/appstore.png" type="image/x-icon" />
      </Head>

      <NextSeo
        title={title}
        description={description}
        canonical={pageURL}
        openGraph={{
          url: pageURL,
          title,
          description,
          site_name: process.env.siteName,
        }}
      />

      <AppThemeSync />

      <AuthProvider>
        <RouteGuard>
          <Layout>
            <Toaster
              toastOptions={{
                style: {
                  zIndex: 999999,
                },
              }}
              containerStyle={{
                zIndex: 999999,
              }}
            />
            <Component {...pageProps} />
          </Layout>
        </RouteGuard>
      </AuthProvider>
    </Provider>
  );
}

export default MyApp;
