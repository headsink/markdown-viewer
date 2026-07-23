use serde::Serialize;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[derive(Serialize)]
struct AppInfo {
    name: &'static str,
    version: &'static str,
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "Markdown Viewer",
        version: env!("CARGO_PKG_VERSION"),
    }
}

#[derive(Default)]
struct PendingFiles(Mutex<Vec<String>>);

#[tauri::command]
fn take_pending_files(state: tauri::State<'_, PendingFiles>) -> Vec<String> {
    let mut guard = state.0.lock().unwrap();
    std::mem::take(&mut *guard)
}

fn extract_file_paths(argv: &[String]) -> Vec<String> {
    argv.iter()
        .skip(1)
        .filter(|a| !a.starts_with('-'))
        .filter(|a| std::path::Path::new(a).is_file())
        .cloned()
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_files = extract_file_paths(&std::env::args().collect::<Vec<_>>());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            let paths = extract_file_paths(&argv);
            if !paths.is_empty() {
                let _ = app.emit("open-files", paths);
            }
        }))
        .manage(PendingFiles(Mutex::new(initial_files)))
        .invoke_handler(tauri::generate_handler![app_info, take_pending_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
