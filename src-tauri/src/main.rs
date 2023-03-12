// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate levenshtein;

use std::error::Error;
use std::ffi::{OsStr, OsString};
use std::fmt::{Debug, Display, Formatter};
use std::fs::{DirEntry, File};
use std::path::PathBuf;
use std::str::FromStr;
use std::{fs, io};

use freedesktop_entry_parser::parse_entry;
use levenshtein::levenshtein;

use crate::ParseEntryError::{IOError, MissingAttributes, WrongExtension};

#[derive(serde::Serialize)]
struct DesktopEntry {
    name: String,
    icon: String,
    exec: String,
}

#[derive(Debug)]
enum ParseEntryError {
    WrongExtension,
    IOError(io::Error),
    MissingAttributes,
}

impl Display for ParseEntryError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Can not retrieve this desktop entry")
    }
}

impl Error for ParseEntryError {}

impl DesktopEntry {
    fn from_file(path: PathBuf) -> Result<DesktopEntry, ParseEntryError> {
        if !path.extension().map_or(false, |ext| ext == "desktop") {
            return Err(WrongExtension);
        }

        let entry = parse_entry(path).map_err(|err| IOError(err))?;

        let desktop_section = entry.section("Desktop Entry");
        if !desktop_section.has_attr("Name") || !desktop_section.has_attr("Exec") {
            return Err(MissingAttributes);
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
    let mut entries = dir
        .filter_map(|result| result.ok())
        .filter(|entry| entry.file_type().map_or(false, |ft| ft.is_file()))
        .collect::<Vec<DirEntry>>();

    entries.sort_by(|a, b| {
        levenshtein(a.file_name().to_str().unwrap_or(""), search_input).cmp(&levenshtein(
            b.file_name().to_str().unwrap_or(""),
            search_input,
        ))
    });

    return entries
        .iter()
        .take(8)
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
