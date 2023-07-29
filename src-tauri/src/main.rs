// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

extern crate levenshtein;

use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};
use tauri::{Manager, SystemTray};
use tauri_plugin_positioner::WindowExt;
use serde::{Serialize, Deserialize};
use rust_search::SearchBuilder;

use std::path;
use std::process::Command;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const WINAPI_CREATE_NO_WINDOW: u32 = 0x08000000;

fn command_new(command_name: String) -> Command {
  let mut command = Command::new(command_name);

  #[cfg(target_os = "windows")]
  command.creation_flags(WINAPI_CREATE_NO_WINDOW);

  return command;
}


#[tauri::command]
fn hide_window(window: tauri::Window) {
    window.hide().unwrap();
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
    window.center().unwrap();
    window.set_focus().unwrap();
}

#[tauri::command]
fn run(path: &str) -> bool {
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
fn search(search_input: &str) -> Vec<Runnable> {
    if search_input.trim().len() < 2 {
        return Vec::new();
    }

    let user_profile = std::env::var("USERPROFILE").expect("USERPROFILE not set").to_string();
    let app_data = std::env::var("APPDATA").expect("APPDATA not set").to_string();
    let program_data = std::env::var("ProgramData").expect("Program Data not set").to_string();

    let dirs_to_look_in = vec![
        user_profile + "\\Desktop",
        app_data + "\\Microsoft\\Windows\\Start Menu\\Programs",
        program_data + "\\Microsoft\\Windows\\Start Menu\\Programs",
    ];

    let mut apps: Vec<String> = SearchBuilder::default()
        .location(dirs_to_look_in[0].to_string())
        .more_locations(dirs_to_look_in.iter().skip(1).map(|s| s.to_string()).collect())
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
        .map(|app| Runnable::new(
                app.to_string().split(path::MAIN_SEPARATOR).last().unwrap().to_string(),
                app.to_string()))
        .collect();
}

#[derive(Serialize, Deserialize)]
struct Runnable {
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
            .cmp(
                &matcher
                    .fuzzy_match(b, search_input)
                    .unwrap_or(0)
                    .abs(),
            )
    });
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let open = CustomMenuItem::new("open".to_string(), "Open");
    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(open);
    let tray = SystemTray::new().with_menu(tray_menu);

    fix_path_env::fix().expect("Can not fix path environments");
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window
                .move_window(tauri_plugin_positioner::Position::Center)
                .expect("Error positioning window");

            show_window(window);
            return Ok(());
        })
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "open" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.center().unwrap();
                },
                "quit" => {
                    std::process::exit(0);
                },
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![search, run, hide_window, show_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
