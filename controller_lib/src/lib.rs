#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(non_snake_case)]

#[macro_use]
extern crate napi_derive;
#[macro_use]
extern crate napi;
#[macro_use]
extern crate lazy_static;

extern crate uuid;
extern crate gilrs;

use napi::bindgen_prelude::*;
use gilrs::{Gilrs, Button, Axis, Event, Gamepad, EventType, GamepadId};
use uuid::Uuid;

use std::time::Duration;
use std::sync::Mutex;
use napi::threadsafe_function::{ThreadsafeFunction, ErrorStrategy, ThreadsafeFunctionCallMode, ThreadSafeCallContext};
use std::{thread, time};

#[derive(Copy, Clone)]
struct GamepadButtonsState {
  South: f32,
  East: f32,
  North: f32, 
  West: f32,
  C: f32, 
  Z: f32,
  LeftTrigger: f32,
  LeftTrigger2: f32,
  RightTrigger: f32,
  RightTrigger2: f32,
  Select: f32,
  Start: f32,
  Mode: f32,
  LeftThumb: f32,
  RightThumb: f32,
  DPadUp: f32,
  DPadDown: f32,
  DPadLeft: f32,
  DPadRight: f32,
  Unknown: f32,
}
impl Default for GamepadButtonsState {
  fn default() -> GamepadButtonsState {
    GamepadButtonsState {
      South: 0.0,
      East: 0.0,
      North: 0.0, 
      West: 0.0,
      C: 0.0, 
      Z: 0.0,
      LeftTrigger: 0.0,
      LeftTrigger2: 0.0,
      RightTrigger: 0.0,
      RightTrigger2: 0.0,
      Select: 0.0,
      Start: 0.0,
      Mode: 0.0,
      LeftThumb: 0.0,
      RightThumb: 0.0,
      DPadUp: 0.0,
      DPadDown: 0.0,
      DPadLeft: 0.0,
      DPadRight: 0.0,
      Unknown: 0.0,
    }
  }
}

#[derive(Copy, Clone)]
struct GamepadAxisState {
  LeftStickX: f32,
  LeftStickY: f32,
  LeftZ: f32,
  RightStickX: f32,
  RightStickY: f32,
  RightZ: f32,
  DPadX: f32,
  DPadY: f32,
  Unknown: f32,
}
impl Default for GamepadAxisState {
  fn default() -> GamepadAxisState {
    GamepadAxisState {
      LeftStickX: 0.0,
      LeftStickY: 0.0,
      LeftZ: 0.0,
      RightStickX: 0.0,
      RightStickY: 0.0,
      RightZ: 0.0,
      DPadX: 0.0,
      DPadY: 0.0,
      Unknown: 0.0,
    }
  }
}

#[derive(Clone)]
struct GamepadState {
  name: String,
  os_name: String,
  is_connected: bool,
  uuid: String,
  gilrs_id: GamepadId,
  buttons: GamepadButtonsState,
  axis: GamepadAxisState,
}

fn getGamepads() -> Vec<GamepadState> {
  let gilrs = Gilrs::new().unwrap();
  let mut vec = Vec::new();

  for (_id, gamepad) in gilrs.gamepads() {
    let controllerUuid = Uuid::from_bytes(gamepad.uuid());
    let buttons = GamepadButtonsState{
      ..Default::default() 
    };
    let axis = GamepadAxisState{
      ..Default::default() 
    };
   

    let controller = GamepadState{
      name: gamepad.name().to_string(),
      os_name: gamepad.os_name().to_string(),
      is_connected: gamepad.is_connected(),
      uuid: controllerUuid.to_hyphenated().to_string(),
      gilrs_id:  gamepad.id(),
      buttons: buttons,
      axis: axis,
    };

    vec.push(controller);
}

  return vec;
}

fn stateToObject(env: Env, state: &GamepadState) -> Object {
  let mut obj = env.create_object().unwrap();
  obj.set("name", state.name.to_string()).unwrap();
  obj.set("os_name", state.os_name.to_string()).unwrap();
  obj.set("is_connected", state.is_connected.to_string()).unwrap();
  obj.set("uuid", state.uuid.to_string()).unwrap();
  obj.set("gilrs_id", state.gilrs_id.to_string()).unwrap();
  
  let mut buttons = env.create_object().unwrap();
  buttons.set("south", f64::from(state.buttons.South)).unwrap();
  buttons.set("east", f64::from(state.buttons.East)).unwrap();
  buttons.set("north", f64::from(state.buttons.North)).unwrap();
  buttons.set("west", f64::from(state.buttons.West)).unwrap();
  buttons.set("c", f64::from(state.buttons.C)).unwrap();
  buttons.set("z", f64::from(state.buttons.Z)).unwrap();
  buttons.set("left_trigger", f64::from(state.buttons.LeftTrigger)).unwrap();
  buttons.set("left_trigger_2", f64::from(state.buttons.LeftTrigger2)).unwrap();
  buttons.set("right_trigger", f64::from(state.buttons.RightTrigger)).unwrap();
  buttons.set("right_trigger_2", f64::from(state.buttons.RightTrigger2)).unwrap();
  buttons.set("select", f64::from(state.buttons.Select)).unwrap();
  buttons.set("start", f64::from(state.buttons.Start)).unwrap();
  buttons.set("mode", f64::from(state.buttons.Mode)).unwrap();
  buttons.set("left_thumb", f64::from(state.buttons.LeftThumb)).unwrap();
  buttons.set("right_thumb", f64::from(state.buttons.RightThumb)).unwrap();
  buttons.set("d_pad_up", f64::from(state.buttons.DPadUp)).unwrap();
  buttons.set("d_pad_down", f64::from(state.buttons.DPadDown)).unwrap();
  buttons.set("d_pad_left", f64::from(state.buttons.DPadLeft)).unwrap();
  buttons.set("d_pad_right", f64::from(state.buttons.DPadRight)).unwrap();
  buttons.set("unknown", f64::from(state.buttons.Unknown)).unwrap();
  
  obj.set("buttons", buttons).unwrap();

  let mut axis = env.create_object().unwrap();
  axis.set("left_stick_x", f64::from(state.axis.LeftStickX)).unwrap();
  axis.set("left_stick_y", f64::from(state.axis.LeftStickY)).unwrap();
  axis.set("left_z", f64::from(state.axis.LeftZ)).unwrap();
  axis.set("right_stick_x", f64::from(state.axis.RightStickX)).unwrap();
  axis.set("right_stick_y", f64::from(state.axis.RightStickY)).unwrap();
  axis.set("right_z", f64::from(state.axis.RightZ)).unwrap();
  axis.set("d_pad_x", f64::from(state.axis.DPadX)).unwrap();
  axis.set("d_pad_y", f64::from(state.axis.DPadY)).unwrap();
  axis.set("unknown", f64::from(state.axis.Unknown)).unwrap();
  
  obj.set("axis", axis).unwrap();

  return obj;
}

#[napi]
fn startGamepadEngine(cb: JsFunction) -> Result<()> {
  let tsfn: ThreadsafeFunction<Vec<GamepadState>, ErrorStrategy::CalleeHandled> =
    cb.create_threadsafe_function(0, 
      |ctx: ThreadSafeCallContext<Vec<GamepadState>>| {
        let mut vec = Vec::new();
        for val in ctx.value.iter() {
          vec.push(stateToObject(ctx.env, val))
        }
        Ok(vec)
      }
    )?;

  thread::spawn(move || {
      let mut gilrs = Gilrs::new().unwrap();
      let mut gamepads = getGamepads();
      let delay = time::Duration::from_millis(4);
      let mut some_change = false;

      tsfn.call(Ok(gamepads.clone()), ThreadsafeFunctionCallMode::Blocking);
      loop {
        some_change = false;
        while let Some(event) = gilrs.next_event() {
          match event {
              Event { id, event: EventType::ButtonChanged(button, value, _code), .. } => {
                for mut gamepad in gamepads.iter_mut() {
                  if gamepad.gilrs_id == id {
                    match button {
                      Button::South => { gamepad.buttons.South = value }
                      Button::East => { gamepad.buttons.East = value }
                      Button::West => { gamepad.buttons.West = value }
                      Button::North => { gamepad.buttons.North = value }
                      Button::C => { gamepad.buttons.C = value }
                      Button::Z => { gamepad.buttons.Z = value }
                      Button::LeftTrigger => { gamepad.buttons.LeftTrigger = value }
                      Button::LeftTrigger2 => { gamepad.buttons.LeftTrigger2 = value }
                      Button::RightTrigger => { gamepad.buttons.RightTrigger = value }
                      Button::RightTrigger2 => { gamepad.buttons.RightTrigger2 = value }
                      Button::RightThumb => { gamepad.buttons.RightThumb = value }
                      Button::LeftThumb => { gamepad.buttons.LeftThumb = value }
                      Button::DPadUp => { gamepad.buttons.DPadUp = value }
                      Button::DPadDown => { gamepad.buttons.DPadDown = value }
                      Button::DPadLeft => { gamepad.buttons.DPadLeft = value }
                      Button::DPadRight => { gamepad.buttons.DPadRight = value }
                      Button::Select => { gamepad.buttons.Select = value }
                      Button::Start => { gamepad.buttons.Start = value }
                      Button::Mode => { gamepad.buttons.Mode = value }
                      Button::Unknown => { gamepad.buttons.Unknown = value }
                    }
                  }
                }
                some_change = true;
              }
              Event { id, event: EventType::AxisChanged(axis, value, _code), .. } => {
                for mut gamepad in gamepads.iter_mut() {
                  if gamepad.gilrs_id == id {
                    match axis {
                      Axis::LeftStickX => { gamepad.axis.LeftStickX = value }
                      Axis::LeftStickY => { gamepad.axis.LeftStickY = value }
                      Axis::LeftZ => { gamepad.axis.LeftZ = value }
                      Axis::RightStickX => { gamepad.axis.RightStickX = value }
                      Axis::RightStickY => { gamepad.axis.RightStickY = value }
                      Axis::RightZ => { gamepad.axis.RightZ = value }
                      Axis::DPadX => { gamepad.axis.DPadX = value }
                      Axis::DPadY => { gamepad.axis.DPadY = value }
                      Axis::Unknown => { gamepad.axis.Unknown = value }
                    }
                  }
                }
                some_change = true;
              }
              Event { id, event: EventType::Connected, .. } => {
                let newGamepads = getGamepads();
                gamepads.retain(|gamepad| gamepad.gilrs_id != id);
                for gamepad in newGamepads {
                  if gamepad.gilrs_id == id {
                    gamepads.push(gamepad)
                  }
                }
                some_change = true;
              }
              Event { id, event: EventType::Disconnected, .. } => {
                gamepads.retain(|gamepad| gamepad.gilrs_id != id);
                some_change = true;
              }
              _ => (),
          };
        }

        if (some_change) {
          tsfn.call(Ok(gamepads.clone()), ThreadsafeFunctionCallMode::Blocking);
        }

        thread::sleep(delay);
      }
    
  });

  
  Ok(())
}
