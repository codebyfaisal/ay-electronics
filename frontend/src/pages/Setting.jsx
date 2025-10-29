// import { useEffect, useState } from "react"
// import Select from "../components/ui/Select"

// const options = [
//   { label: "Default", value: "default" },
//   { label: "Poppins", value: "poppins-custom" },
//   { label: "Play", value: "play-custom" }
// ]

// const Setting = () => {
//   const [currentFont, setCurrentFont] = useState(
//     localStorage.getItem("font")
//   );

//   useEffect(() => {
//     document.body.classList.add(currentFont)
//   }, [currentFont])

//   const handleOnChange = (e) => {
//     const font = e.target.value

//     setCurrentFont((prev) => {
//       document.body.classList.remove(prev)
//       document.body.classList.add(font)
//       return font
//     })

//     localStorage.setItem("font", font)
//   }

//   return (
//     <>
//       <div className="space-y-8">
//         <h1 className="text-3xl font-bold">App Settings</h1>
//         {<Select
//           label="Choose UI font Style"
//           name="fontChanger"
//           options={options}
//           onChange={handleOnChange}
//           value={currentFont}
//         />}
//       </div>
//     </>
//   )

// }

// export default Setting

// src/pages/Setting.jsx
import Button from "../components/ui/Button";
import Select from "../components/ui/Select"; // Assuming Select component exists
import { useFont } from "../context/FontContext";
import { useTheme } from "../context/ThemeContext";

const options = [
  { label: "Default", value: "default" },
  { label: "Poppins", value: "poppins-custom" },
  { label: "Play", value: "play-custom" }
];

const Setting = () => {
  // Use the custom hooks to get and change settings
  const { currentFont, changeFont } = useFont();
  const { theme, toggleTheme } = useTheme();

  const handleFontChange = (e) => {
    changeFont(e.target.value);
  };

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">App Settings ⚙️</h1>

        {/* Font Changer Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Font Style</h2>
          <Select
            label="Choose UI font Style"
            name="fontChanger"
            options={options}
            onChange={handleFontChange}
            value={currentFont}
          />
        </section>

        {/* Theme Changer Section */}
        <section className="space-y-4 border-t pt-4">
          <h2 className="text-xl font-semibold">App Theme</h2>
          <div className="flex items-center justify-between rounded-lg">
            <Button
              onClick={toggleTheme}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-150"
            >
              Switch to {theme === 'light' ? 'Dark' : 'Light'}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Setting; 