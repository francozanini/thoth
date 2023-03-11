// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use freedesktop_entry_parser::parse_entry;
use std::ffi::{OsStr, OsString};
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

impl DesktopEntry {
    fn from_file(path: PathBuf) -> Result<DesktopEntry, &'static str> {
        if !path.extension().map_or(false, |ext| ext == "desktop") {
            return Err("Must provide desktop file");
        }

        let read_result = parse_entry(path);
        if read_result.is_err() {
            return Err("Could not parse entry");
        }

        let entry = read_result.unwrap();
        if !entry.has_section("Desktop Entry") {
            return Err("Not valid Desktop Entry");
        }

        let desktop_section = entry.section("Desktop Entry");
        if !desktop_section.has_attr("Name") || !desktop_section.has_attr("Exec") {
            return Err("Not a named executable");
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
