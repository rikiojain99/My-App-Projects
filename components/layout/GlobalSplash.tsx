// "use client";

// import { useEffect, useState } from "react";

// export default function GlobalSplash() {
//   const [show, setShow] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setShow(false);
//     }, 2500); // 1.5 seconds

//     return () => clearTimeout(timer);
//   }, []);

//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 `z-[9999]` flex items-center justify-center ">
//       <img
//         src="/Sj.png"
//         alt="Logo"
//         className="w-60 h-60 animate-pulse"
//       />
//     </div>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { usePathname } from "next/navigation";

// export default function GlobalSplash() {
//   const [visible, setVisible] = useState(true);
//   const pathname = usePathname();

//   useEffect(() => {
//     // Show splash on every hard refresh or first load
//     setVisible(true);

//     const timer = setTimeout(() => {
//       setVisible(false);
//     }, 1500); // 1.5 seconds

//     return () => clearTimeout(timer);
//   }, [pathname]);

//   if (!visible) return null;

//   return (
//     <div className="fixed inset-0 `z-[9999]` flex items-center justify-center transition-opacity bg-gray-500 duration-500">
//       <div className="flex flex-col items-center gap-4 animate-fadeIn">
//         <img
//           src="/Sj.png"
//           alt="Logo"
//           className="w-72 h-72 animate-logo"
//         />
//         <p className="text-white text-lg font-semibold tracking-wide">
//           SJ Light House
//         </p>
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function GlobalSplash() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setVisible(true);
    setFadeOut(false);

    // Keep splash visible for at least 1 second on page transitions.
    const fadeDelay = 1050;
    const removeDelay = 1000;

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, fadeDelay);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, removeDelay);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none fixed left-0 right-0 top-14 bottom-16 md:top-16 md:bottom-0 z-40 flex items-center justify-center bg-gray-300/90 px-4 transition-all duration-200 ${
        fadeOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        <img
          src="/Sj.png"
          alt="Logo"
          className="h-40 w-40 md:h-72 md:w-72 animate-logo"
        />
        <h1 className="text-white text-lg md:text-2xl font-semibold tracking-wide -mt-10 md:-mt-16">
          SJ Light House
        </h1>
      </div>
    </div>
  );
}
