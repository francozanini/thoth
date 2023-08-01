use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use rust_search::SearchBuilder;
use serde::{Deserialize, Serialize};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::path;
use std::process::Command;

#[cfg(target_os = "windows")]
const WINAPI_CREATE_NO_WINDOW: u32 = 0x08000000;

fn command_new(command_name: String) -> Command {
    let mut command = Command::new(command_name);

    #[cfg(target_os = "windows")]
    command.creation_flags(WINAPI_CREATE_NO_WINDOW);

    return command;
}

#[tauri::command]
pub fn hide_window(window: tauri::Window) {
    window.hide().unwrap();
}

#[tauri::command]
pub fn show_window(window: tauri::Window) {
    window.show().unwrap();
    window.center().unwrap();
    window.set_focus().unwrap();
}

#[tauri::command]
pub fn run(path: &str) -> bool {
    let result = command_new("cmd.exe".to_string())
        .arg("/C")
        .arg("start")
        .arg("")
        .arg(path)
        .spawn();

    return match result {
        Ok(ok) => {
            println!("Program run {:?}", ok);
            true
        }
        e => {
            println!("Program error {:?}", e);
            false
        }
    };
}

#[tauri::command]
pub fn search(search_input: &str) -> Vec<Runnable> {
    if search_input.trim().len() < 2 {
        return Vec::new();
    }

    let user_profile = std::env::var("USERPROFILE")
        .expect("USERPROFILE not set")
        .to_string();
    let app_data = std::env::var("APPDATA")
        .expect("APPDATA not set")
        .to_string();
    let program_data = std::env::var("ProgramData")
        .expect("Program Data not set")
        .to_string();

    let dirs_to_look_in = vec![
        user_profile + "\\Desktop",
        app_data + "\\Microsoft\\Windows\\Start Menu\\Programs",
        program_data + "\\Microsoft\\Windows\\Start Menu\\Programs",
    ];

    let mut apps: Vec<String> = SearchBuilder::default()
        .location(dirs_to_look_in[0].to_string())
        .more_locations(
            dirs_to_look_in
                .iter()
                .skip(1)
                .map(|s| s.to_string())
                .collect(),
        )
        .search_input(search_input.to_string())
        .ext(".lnk|.exe")
        .ignore_case()
        .limit(10)
        .build()
        .collect();

    sort_by_match(&search_input, &mut apps);

    return apps
        .iter()
        .rev()
        .take(10)
        .map(|app| {
            Runnable::new(
                app.to_string()
                    .split(path::MAIN_SEPARATOR)
                    .last()
                    .unwrap()
                    .replace(".lnk", "")
                    .to_string(),
                app.to_string(),
            )
        })
        .collect();
}

#[derive(Serialize, Deserialize)]
pub struct Runnable {
    name: String,
    exec: String,
}

impl Runnable {
    fn new(name: String, exec: String) -> Runnable {
        Runnable { name, exec }
    }
}

fn sort_by_match(search_input: &&str, entries: &mut Vec<String>) {
    let matcher = SkimMatcherV2::default();
    entries.sort_by(move |a, b| {
        matcher
            .fuzzy_match(a, search_input)
            .unwrap_or(0)
            .abs()
            .cmp(&matcher.fuzzy_match(b, search_input).unwrap_or(0).abs())
    });
}
