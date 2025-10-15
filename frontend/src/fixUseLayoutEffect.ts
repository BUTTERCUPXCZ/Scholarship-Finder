import React from "react";

// Fix Framer Motion's useLayoutEffect issue in SSR/Preview
if (typeof window === "undefined" || !window.document) {
    React.useLayoutEffect = React.useEffect;
}
