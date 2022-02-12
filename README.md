# controller-swapper-multi

**Note: For now this application is only supported on windows.**

# What is This

This tool creates a virtual controller on the host machine its run on and allows players to connect to that controller over the internet, forwarding their inputs based off the input mode.

You can either have the system swap what player controls the controller randomly, manually swap players, or have the system accept all inputs from the players controllers.

# How to Setup

1. Download the Latest Release package from the [Release Page](https://github.com/LtSquigs/controller-swapper-multi/releases)
2. If you want to be the host, you need vigem installed. This may be installed already if you have parsec on your machine, if not you must download it [here](https://vigem.org/)
3. Launch the Controller Swapper Executable
4. You will be prompted if you want to be the Host or a Cient. The Host controls the settings and which player is playing.
5. To host: Enter your Username and hit the Host Button.
  - The host may have to forward port 54545 on your router to allow clients in
6. To connect as a Client: Enter your username and the hosts IP address and hit connect.
  - Every client must have a different username or it all breaks!
7. You will launch into the settings pag here the hosts can change what settings they want and players can see the connection status of other players.
8. When all players are ready and settings confingured the Host can hit the "Start Forwarding" button to start forwarding inputs based off the current settings.
  - When not Forwarding, the program will only forward the hosts selected controller, this is to make it easier to configure/test the controller in various applications.

# Settings

The settings on the settings page include:

  - Main Tab
    - Forwarded Controller: Which controller you want to forward to the system
    - Show Countdown Window: Wether or not to show the countdown window. This is a transparent, always on top text that shows the countdown as it happens. Useful for knowing if a swap is coming up.
    - Enable Moving Countdown: Normally all mouse events just pass through the countdown window, clicking this will give you the ability to move it where you want, just remember to unclick it when you have it where you need it to be.
    - Show Player Window: Wether or not to show the countdown window. This is a transparent, always on top text that shows the current player that is forwarding controls to the controller.
    - Enable Moving Player: Normally all mouse events just pass through the player window, clicking this will give you the ability to move it where you want, just remember to unclick it when you have it where you need it to be.
    - User List: A list of users and their current status. Either "No Controller" for no controller selected for forwarding, "Ready" for ready to start sending controller inputs, and "Runner" for the currently selected player.
      - The Host will also have a button here to "Change Player", which will mark that player as the current Runner
  - Controller Mapping
    - A tab to let you set the controller mapping if desired. Click on an input and press a button/move a stick to set it.
  - Swap Settings (Host Only)
    - Swapping Mode
      - Random: Will randomly swap who is controlling the virtual controller within intervals set by the swap time parameters
      - Manual: Will not do any special swap logic, allowing the host to manually swap players through the User List
      - All For One: All players with connected controllers are sent to the forwarded controller. A button is considered pressed if at least one player is pressing it, and unpressed only if no players are pressing it. Analog values are all added together.
    - Minimum Swap Time
      - The minimum time before a swap can occure
    - Maximum Swap Time
      - The maximum time before a swap must occur
    - Enabled Countdown
      - If turned on there will be a 3 second countdown before the swap occurs and the countdown timer on the app will display the countdown to all players.

# Configuring The Virtual Controller In Games

The virtual controller is an XInput controller, so most games should be able to support it, but getting a game to select the right virtual controller can be annoying and frustrating (many games do not let you chose the controller for each player and the names of all the x-input controllers default to "Xbox Controller").

Here are some tips for getting games to recognize the right controller:

1. If a game allows you to choose a specific controller, great. The index of the XInput controller is shown in the Host players UI and can be used to try to figure out which controller is the virtual one.
2. You can use online gamepad visualizers to try to identify the virtual controller. Set the mod to "All For One" and have a friend press buttons until you identify the controller.
3. In windows you can configure a gamepad to be the "default" gamepad, if you can identify the gamepad in the windows gamepad configuration tools, you can try to set this to make certain games identify the virtual controller.
4. In Steam Big Picture mode, you can re-order the order of the gamepads while playing a game by going into the steam overlay and changing the controller order. Can take a few tries to get right, but can be used on a variety of games.
5. If all of that doesnt help, you can try restarting your PC with your controllers removed, than launch the app and hit Host before plugging anything in/connecting with parsec. Windows should pick up the virtual controller as the first controller at that point hopefully.

Some Caveats to Know: If the host has a local controller, that local controller will also be sending inputs at the same time as the virtual one when they are in control of it. That can make it annoying to identify the right controller, as well as make some things act weird (Steam Big Picture Mode e.g. is harder to navigate as it accepts all inputs from all controllers).

Similarly, if the players are connected to your machine with parsec with the virtual controllers in parsec enabled, they will also cause double inputs making it annoying to identify the right controller.

Anyways, those are about the best tips I can give you, just futz around with it until it seems like you picked up the right controller. If you set the system into "All For One" mode and hit the Start Forwarding button, all the players inputs will be forwarded, which can make it easier for you to distinguish between the right and wrong controllers.

Wish I could give more advice, but the limitations of the gamepad and xinput apis in windows make this a nightmare!

# TODO

List of things that may eventually be added to this system:

1. Potentially port over Twitch integration from bizhawk swapper.
2. Look at Mac OSX integration, theoretically possible with the rust library, but not with the vigem, might be a nightmare.
