// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate levenshtein;

use std::borrow::Borrow;
use std::cmp::Ordering;
use std::error::Error;
use std::ffi::OsString;
use std::fmt::{Debug, Display, Formatter};
use std::fs::DirEntry;
use std::path::PathBuf;
use std::{fs, io};

use freedesktop_entry_parser::parse_entry;
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use levenshtein::levenshtein;
use tauri::api::process::Command;
use tauri::Manager;
use tauri_plugin_positioner::WindowExt;

use crate::ParseEntryError::{IOError, MissingAttributes, WrongExtension};

#[derive(serde::Serialize)]
struct DesktopEntry {
    name: String,
    file_name: String,
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
        let file_name = path.file_name().map_or("".to_string(), |os_string| {
            os_string.to_str().unwrap().to_string()
        });

        let entry = parse_entry(path).map_err(|err| IOError(err))?;

        let desktop_section = entry.section("Desktop Entry");
        if !desktop_section.has_attr("Name") || !desktop_section.has_attr("Exec") {
            return Err(MissingAttributes);
        }

        return Ok(DesktopEntry {
            name: desktop_section.attr("Name").unwrap().to_string(),
            file_name,
            icon: desktop_section
                .attr("Icon")
                .or_else(|| Some("No icon"))
                .unwrap()
                .to_string(),
            exec: desktop_section.attr("Exec").unwrap().to_string(),
        });
    }
}
fn levenshtein_compare(distance_to: &&str, a: &DirEntry, b: &&DirEntry) -> Ordering {
    return levenshtein(
        a.file_name().to_str().unwrap_or("").to_lowercase().as_str(),
        distance_to,
    )
    .cmp(&levenshtein(
        b.file_name().to_str().unwrap_or("").to_lowercase().as_str(),
        distance_to,
    ));
}
#[tauri::command]
fn spawn_process(path: &str) {
    let args: Vec<&str> = path.split(" ").collect();
    let result = Command::new(args[0]).args(&args[1..]).spawn();

    match result {
        Ok(whatever) => println!("{:?}", whatever),
        e => println!("{:?}", e),
    }
}

#[tauri::command]
fn all_apps(search_input: &str) -> Vec<DesktopEntry> {
    if search_input.is_empty() {
        return Vec::new();
    }

    let dir = fs::read_dir("/usr/share/applications").expect("desktop apps are readable");
    let mut entries = dir
        .filter_map(|result| result.ok())
        .filter(|entry| entry.file_type().map_or(false, |ft| ft.is_file()))
        .collect::<Vec<DirEntry>>();

    sort_by_match(&search_input, &mut entries);

    return entries
        .iter()
        .rev()
        .take(8)
        .map(|entry| DesktopEntry::from_file(entry.path()))
        .filter_map(|desktop_entry| desktop_entry.ok())
        .collect();
}

fn sort_by_match(search_input: &&str, entries: &mut Vec<DirEntry>) {
    let matcher = SkimMatcherV2::default();
    entries.sort_by(move |a, b| {
        matcher
            .fuzzy_match(a.file_name().to_str().unwrap(), search_input)
            .unwrap_or(0)
            .abs()
            .cmp(
                &matcher
                    .fuzzy_match(b.file_name().to_str().unwrap(), search_input)
                    .unwrap_or(0)
                    .abs(),
            )
    });
}

fn main() {
    fix_path_env::fix();
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window
                .move_window(tauri_plugin_positioner::Position::Center)
                .expect("Error positioning window");
            return Ok(());
        })
        .invoke_handler(tauri::generate_handler![all_apps, spawn_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
