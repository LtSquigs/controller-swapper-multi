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
use gilrs::{Gilrs, Button, Event, Gamepad};
use uuid::Uuid;

use std::thread;
use std::time::Duration;
use std::sync::Mutex;
use napi::threadsafe_function::{ThreadsafeFunction, ErrorStrategy, ThreadsafeFunctionCallMode, ThreadSafeCallContext};

struct GamepadButtonState {
  A: f32,
  B: f32,
  X: f32,
  Y: f32,
  START: f32,
  BACK: f32,
  LS_PRESS: f32,
  RS_PRESS: f32,
}
struct GamepadState {
  name: String,
  os_name: String,
  is_connected: bool,
  uuid: String,
  gilrs_id: String,
}

fn getGamepads() -> Vec<GamepadState> {
  let gilrs = Gilrs::new().unwrap();
  let mut vec = Vec::new();

  for (_id, gamepad) in gilrs.gamepads() {
    let controllerUuid = Uuid::from_bytes(gamepad.uuid());
    let controller = GamepadState{
      name: gamepad.name().to_string(),
      os_name: gamepad.os_name().to_string(),
      is_connected: gamepad.is_connected(),
      uuid: controllerUuid.to_hyphenated().to_string(),
      gilrs_id:  gamepad.id().to_string(),
    };

    // let mut buttons = env.create_object().unwrap();
   
    // for (code, button) in gamepad.state().buttons() {
    //   buttons.set(code.to_string(), button.value().to_string()).unwrap();
    // }

    // controller.set("buttons", buttons).unwrap();

    vec.push(controller);
}

  return vec;
}

fn stateToObject(mut obj: Object, state: &GamepadState) -> Object {
  obj.set("name", state.name.to_string()).unwrap();
  obj.set("os_name", state.os_name.to_string()).unwrap();
  obj.set("is_connected", state.is_connected.to_string()).unwrap();
  obj.set("uuid", state.uuid.to_string()).unwrap();
  obj.set("gilrs_id", state.gilrs_id.to_string()).unwrap();
  return obj;
}

#[napi]
fn startGamepadEngine(cb: JsFunction) -> Result<()> {
  let tsfn: ThreadsafeFunction<Vec<GamepadState>, ErrorStrategy::CalleeHandled> =
    cb.create_threadsafe_function(0, 
      |ctx: ThreadSafeCallContext<Vec<GamepadState>>| {
        let mut vec = Vec::new();
        for val in ctx.value.iter() {
          vec.push(stateToObject(ctx.env.create_object().unwrap(), val))
        }
        Ok(vec)
      }
    )?;

  thread::spawn(move || {
      let mut gilrs = Gilrs::new().unwrap();

      let gamepads = getGamepads();
      tsfn.call(Ok(gamepads), ThreadsafeFunctionCallMode::Blocking);
      loop {
          // Examine new events
          while let Some(Event { id: _, event: _, time: _ }) = gilrs.next_event() {
            let gamepads = getGamepads();
            // Anytime theres a new event, lets update the state
            tsfn.call(Ok(gamepads), ThreadsafeFunctionCallMode::Blocking);
          }
    
          // // You can also use cached gamepad state
          // if let Some(gamepad) = active_gamepad.map(|id| gilrs.gamepad(id)) {
          //     if gamepad.is_pressed(Button::South) {
    
          //     }
          // }
      }
    
  });

  
  Ok(())
}
