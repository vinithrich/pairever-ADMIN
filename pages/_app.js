import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "@/helper/Redux/Store";
import DefaultDashboardLayout from "@/layouts/DefaultDashboardLayout";
import { AuthProvider, useAuth } from "@/helper/Context/AuthContext";
import { canAccessPath, getFirstAllowedPath } from "@/helper/accessControl";
import "../styles/theme.scss";
import "../styles/Customized Styles/Customized.scss";

const PUBLIC_ROUTES = ["/", "/404", "/privacy-policy"];

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

    if (isAuthenticated && router.pathname === "/") {
      const nextPath = getFirstAllowedPath(user);

      if (nextPath !== router.pathname) {
        router.replace(nextPath);
      }

      return;
    }

    if (
      isAuthenticated &&
      !isPublicRoute &&
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
