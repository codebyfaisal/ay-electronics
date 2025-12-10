import { useState } from "react";
import { Download, Sun, Moon, Palette, Clock, RotateCw } from "lucide-react";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import useFetch from "../hooks/useFetch";
import Table from "../components/Table";
import apiClient from "../api/apiClient";

const options = [
  { label: "Default", value: "default" },
  { label: "Poppins", value: "poppins-custom" },
  { label: "Play", value: "play-custom" }
];

const Setting = () => {
  // Context hooks (with safe fallbacks)
  const { currentFont, changeFont } = useFont() || {
    currentFont: localStorage.getItem("font") || "default",
    changeFont: () => { }
  };

  const { theme, toggleTheme } = useTheme() || {
    theme: "light",
    toggleTheme: () => { }
  };

  const [downloadLoading, setDownloadLoading] = useState(false);

  // --- Fetch current backups ---
  const {
    data: backupsData,
    refetch: refetchBackups
  } = useFetch("/settings/backups", {}, true);

  const backups = backupsData?.backups || [];

  // --- Handle font change ---
  const handleFontChange = (e) => {
    const font = e.target.value;
    if (changeFont) {
      changeFont(font);
    } else {
      document.body.classList.remove(currentFont);
      document.body.classList.add(font);
      localStorage.setItem("font", font);
    }
  };

  // --- Handle DB backup creation ---
  const handleBackupClick = async () => {
    setDownloadLoading(true);
    try {
      await apiClient.get("/settings/backup");
      // Optionally refetch backup list after creating new backup
      await refetchBackups();
    } catch (err) {
      console.error("Backup creation failed:", err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleAction = async (action, path) => {
    if (action === "view") {
      try {
        const response = await apiClient.get("/settings/open-folder?path=" + path);
        if (!response.data.success) {
          console.error("Failed to open folder:", response.data.message);
          alert("Failed to open folder on server.");
        }
      } catch (err) {
        console.error("Failed to open folder:", err.message);
        alert("Failed to open folder on server.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">App Settings</h1>

      <section className="space-y-4 border-b pb-6 border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <Palette className="w-5 h-5" /> <span>Appearance</span>
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <Select label="UI Font Style"
            name="fontChanger"
            options={options}
            onChange={handleFontChange}
            value={currentFont}
          />

          <div>
            <label className="text-right font-medium block pb-[0.2rem]">UI Theme</label>
            <div className="flex items-center justify-end gap-4 w-full py-[0.25rem] rounded-md
            bg-[rgb(var(--input-bg))] ring ring-[rgb(var(--border))] font-medium">
              <span className="text-sm capitalize">{theme}</span>
              <Button
                onClick={toggleTheme}
                variant="secondary"
                title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-lg font-semibold mt-6 flex items-center space-x-2">
            <Clock className="w-4 h-4" />{" "}
            <span>Recent Backups ({backups.length})</span>
          </h3>
          <Button
            variant="primary"
            onClick={handleBackupClick}
            disabled={downloadLoading}
          >
            {
              downloadLoading ? (
                <RotateCw className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (<Download className="w-5 h-5 mr-2" />)
            }
            Backup DB
          </Button>
        </div>

        <Table
          purpose="backups"
          columns={[
            {
              header: "Backup Folder",
              accessor: "folderName"
            }
          ]}
          data={backups.map(bkp => ({ id: bkp.path, folderName: bkp.folderName }))}
          activeActions={{ view: true }}
          pagination={{
            page: 1,
            limit: 10,
            total: backups.length
          }}
          onAction={handleAction}
        />
      </section>
    </div>
  );
};

export default Setting;
