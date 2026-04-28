import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/helper/Context/AuthContext";

const PrivateRoute = (WrappedComponent) => {
  const ProtectedComponent = (props) => {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace("/");
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return ProtectedComponent;
};

export default PrivateRoute;
