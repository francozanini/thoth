// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use freedesktop_entry_parser::parse_entry;
use std::error::Error;
use std::ffi::{OsStr, OsString};
use std::fmt::{Debug, Display, Formatter};
use std::fs;
use std::fs::{DirEntry, File};
use std::path::PathBuf;
use std::str::FromStr;

#[derive(serde::Serialize)]
struct DesktopEntry {
    name: String,
    icon: String,
    exec: String,
}

#[derive(Debug)]
struct UnreadableEntry;

impl Display for UnreadableEntry {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Can not retrieve this desktop entry")
    }
}

impl Error for UnreadableEntry {}

impl DesktopEntry {
    fn from_file(path: PathBuf) -> Result<DesktopEntry, UnreadableEntry> {
        if !path.extension().map_or(false, |ext| ext == "desktop") {
            return Err(UnreadableEntry);
        }

        let entry = parse_entry(path).map_err(|err| UnreadableEntry)?;

        let desktop_section = entry.section("Desktop Entry");
        if !desktop_section.has_attr("Name") || !desktop_section.has_attr("Exec") {
            return Err(UnreadableEntry);
        }

        return Ok(DesktopEntry {
            name: desktop_section.attr("Name").unwrap().to_string(),
            icon: desktop_section
                .attr("Icon")
                .or_else(|| Some("No icon"))
                .unwrap()
                .to_string(),
            exec: desktop_section.attr("Exec").unwrap().to_string(),
        });
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn all_apps(search_input: &str) -> Vec<DesktopEntry> {
    let dir = fs::read_dir("/usr/share/applications").expect("desktop apps are readable");
    return dir
        .filter_map(|result| result.ok())
        .filter(|entry| entry.file_type().is_ok() && entry.file_type().unwrap().is_file())
        .map(|entry| DesktopEntry::from_file(entry.path()))
        .filter_map(|desktop_entry| desktop_entry.ok())
        .collect();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![all_apps])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
