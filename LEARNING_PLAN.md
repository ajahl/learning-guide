# Learning Plan — Unreal Engine 5 & the GEMSTAR Project

A staged path from "never opened Unreal" to "can read, modify, and extend GEMSTAR."
Each phase has **goals**, **resources**, **hands-on exercises grounded in this repo**, and a
**checkpoint** you must pass before moving on. Work top to bottom — later phases assume earlier ones.

> **The story you're inside.** A transit authority is weeks from approving an autonomous shuttle for a
> downtown route. Before it carries a passenger, someone must answer: *when a pedestrian steps off the
> curb at dusk, will the shuttle's sensors see them?* You don't test that on a live street — you test it
> in **GEMSTAR**, and you've just joined the team that runs it. Today it's a black box of seven
> interlocking plugins. Your job, over the phases below, is to understand it well enough to **build that
> pedestrian-detection scenario yourself** and add the one sensor parameter the authority keeps asking
> about. Each phase is a chapter; by the last one you're changing the machine, not just reading it.

> **Time:** estimates are in *focused hours* (head-down, no distractions), not calendar time —
> harder to inflate. Total core path ≈ **30–50 focused hours** (Phase 2 dominates and depends on your
> C++ background; Phase 6 is open-ended). At a couple of evenings a week that's roughly a month;
> a few full weekends and you're through the core. Adjust freely.
> **Platform (read first):** see [Platform Reality](#platform-reality) at the bottom. Short version:
> on **Windows** the whole project builds & runs (the documented platform); on **macOS** the pure-UE
> phases work but the native-library features (esmini/SUMO) need a port. The learning is the same on both.

---

## Phase 0 — Orientation (~1–2 h)

> *Chapter 0 · The Black Box* — You're handed GEMSTAR and the authority's question. First, the shape of the machine.

**Goal:** Know what GEMSTAR *is* and how its pieces relate, before touching code.

**Do:**
- Read [README.md](../README.md) end to end.
- Open [GEMSTAR_Architecture.drawio](../GEMSTAR_Architecture.drawio) (VS Code drawio extension, or app.diagrams.net).
- Skim the plugin list in [GEMSTAR.uproject](../GEMSTAR.uproject) — note the 7 GameFeature
  plugins + `GEMSTAR_Interfaces`.

**Mental model to internalize:**
- GEMSTAR is **not a game** — it's a set of UE plugins for sensor & traffic simulation.
- One shared plugin (`gemstar_interfaces`) defines all the contracts; feature plugins only
  depend on it, never on each other (hub-and-spoke).
- Everything serializes to **OSI** messages (an automotive simulation standard).

**Checkpoint:** In 3–4 sentences, write what each plugin does and how data flows from a
simulator (esmini/SUMO) to a sensor to the logger. (You can check yourself against the
[Data Flow](#appendix--data-flow-cheat-sheet) appendix.)

---

## Phase 1 — Unreal Editor Fundamentals (~4–6 h)

> *Chapter 1 · Learning to See* — Walk the machine's world before you read its mind.

**Goal:** Be comfortable in the editor and with Blueprints. You cannot read this codebase
without knowing what the C++ is *driving*.

**Concepts:**
- Actors, Components, the Level/World, the Game Loop (`Tick`).
- Blueprints (visual scripting), the Content Browser, maps (`.umap`), DataTables.
- Play-In-Editor (PIE), the Output Log, the console (`~`).

**Resources:**
- Epic "Understanding the Basics" docs.

**🎥 Watch:**
- [Your First Hour in Unreal Engine](https://dev.epicgames.com/community/learning/courses/3ke/your-first-hour-in-unreal-engine-5-2) — Epic's official hands-on video course. The single best practical starting point.

**Exercises:**
1. New empty UE project (Blueprint, not C++). Place a cube, make it rotate with a Blueprint.
2. Create a Blueprint Actor that prints to the Output Log on `BeginPlay` and every `Tick`.
3. Make a simple DataTable and read a row from a Blueprint. *(Why: `ue_vehicle_feature` maps
   vehicle types → Blueprints via a DataTable — you'll meet this pattern.)*

**Checkpoint:** Without notes, explain `BeginPlay` vs `Tick`, and what an Actor vs a Component is.

---

## Phase 2 — C++ in Unreal (~12–20 h; more if C++ is new to you)

> *Chapter 2 · The Contracts* — Its parts are strangers; they cooperate only through interfaces. Learn that language.

**Goal:** Read and write UE-flavored C++. This is where GEMSTAR lives.

**Concepts (UE-specific, not plain C++):**
- Reflection macros: `UCLASS`, `UPROPERTY`, `UFUNCTION`, `USTRUCT`, `UENUM`.
- Garbage collection & `UObject` ownership; `TObjectPtr`, `UPROPERTY()` keeping refs alive.
- Actor lifecycle in C++: `BeginPlay`, `Tick`, `EndPlay`.
- **UInterfaces** (`UINTERFACE`/`IInterface`) — *the* central pattern in this repo.
- **Spawning & casting**: `SpawnActor`, `Cast<>`, `GetOwner`, `UActorComponent` — the building blocks
  of GEMSTAR's loader pattern (exercised hands-on in Phase 3).
- Modules & the build system: `.Build.cs`, `.Target.cs` (the C# files), `PublicDependencyModuleNames`.
- Logging: `UE_LOG` (note: 5.7's `bValidateFormatStrings=true` — which we enabled — checks these
  at compile time).

**Resources:**
- Epic "Programming with C++" docs + "Gameplay Architecture" (Actors, Interfaces).

**🎥 Watch:**
- [The Unreal Engine Game Framework: From int main() to BeginPlay](https://www.youtube.com/watch?v=IaU2Hue-ApI) — Alex Forsythe. The clearest explanation of UE's object/actor/world model — exactly the mental model for reading `AGEMSTARRoot` and the managers.
- [Unreal Engine 5 C++ Complete Guide](https://tomlooman.com/unreal-engine-cpp-guide/) — Tom Looman. Free written+video reference for pointers, interfaces, macros, delegates, modules.

**Exercises (in your scratch project, not GEMSTAR):**
1. Write a C++ `AActor` subclass with a `UPROPERTY(EditAnywhere)` float; change it in the editor.
2. Define a `UINTERFACE` with one `BlueprintNativeEvent`; implement it on an Actor; call it
   through the interface pointer.
3. Add a second module/plugin and make one depend on the other via `.Build.cs`.

**Then read GEMSTAR code in this order (easy → hard):**
1. [Source/GEMSTAR/GEMSTAR.Build.cs](../Source/GEMSTAR/GEMSTAR.Build.cs) + the (near-empty) game module — warm-up on structure.
2. [GEMSTARManager.h](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/Public/GEMSTARManager.h) — the core `IGEMSTARManager` interface.
3. [GEMSTARRoot.h](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/Public/GEMSTARRoot.h) / [GEMSTARRoot.cpp](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/Private/GEMSTARRoot.cpp) — the orchestrator that reads config and wires managers.

**Checkpoint:** Explain, pointing at `GEMSTARRoot`, how a UE interface differs from a plain C++
abstract class, and why GEMSTAR uses interfaces to decouple plugins.

---

## Phase 3 — The UE Systems GEMSTAR Is Built On (~5–8 h)

> *Chapter 3 · Ignition* — How a dormant feature wakes: follow the loader that sparks each one to life on a config flag.

**Goal:** Understand the intermediate UE systems this architecture depends on — learn each
*because* GEMSTAR uses it.

| System | Why it matters here | Where to see it |
|--------|--------------------|-----------------|
| **Plugins** (`.uplugin`, load phases) | Every feature is a plugin (handles *loading* the code/content) | [ue_lidar_feature.uplugin](../Plugins/GameFeatures/ue_lidar_feature/ue_lidar_feature.uplugin) |
| **Loader-component pattern** (`UActorComponent` + `SpawnActor` + `Cast<>`) | **How GEMSTAR actually inits a feature** — see below | [GEMSTAR_Lidar_Loader.cpp](../Plugins/GameFeatures/ue_lidar_feature/Source/ue_lidar_featureRuntime/Private/GEMSTAR_Lidar_Loader.cpp) |
| **Config / `.ini`** | `DefaultGemstar.ini` + the Root's `Use*` bools decide which loaders spawn their manager | [Config/DefaultGemstar.ini](../Config/DefaultGemstar.ini), [GemstarLidarTest.ini](../Plugins/GameFeatures/ue_lidar_feature/Resources/GemstarLidarTest.ini) |
| **DataTables** | Vehicle type → Blueprint mapping | `ue_vehicle_feature` |
| **Chaos Vehicles** | Physics vehicles | `ue_vehicle_feature` |
| **Scene Capture / Render Targets** | Camera image capture | `ue_camera_feature` |
| **Line traces / raycasts** | Lidar point generation | [SimpleLidar.cpp](../Plugins/GameFeatures/ue_lidar_feature/Source/ue_lidar_featureRuntime/Private/SimpleLidar.cpp) |

> **⚠️ Don't be misled by the standard tutorials.** The idiomatic Unreal way to initialize a Game
> Feature is a `UGameFeatureAction` on a `GameFeatureData` asset (what the videos below teach).
> **GEMSTAR does NOT use that.** Each feature has a `GEMSTAR_*_Loader` that is a plain
> `UActorComponent` on `BP_GEMSTAR_Root`; on `BeginPlay` it `Cast<AGEMSTARRoot>`s its owner, checks a
> `Use*` bool (e.g. `UseLidar`), and `SpawnActor`s the manager, then calls
> `RegisterManagerAndGetConfiguration` + `Configure`. The GameFeature plugin system only *loads* the
> plugin; this component does the wiring. Learn the standard way for context, but practice the pattern
> GEMSTAR actually uses.

**Resources:**
- Epic "Game Features and Modular Gameplay in Unreal Engine" (context: the *standard* approach).
- Epic "Configuration Files" docs.

**🎥 Watch:**
- [Modular Game Features in UE5: plug ‘n play, the Unreal way](https://www.youtube.com/watch?v=3PBnqC7TxvM) — Epic's overview of the GameFeature plugin system (used here for plugin *loading*; it teaches GameFeatureActions for init, which GEMSTAR replaces with a loader component).
- [Getting started with Modular Game Features in UE5](https://www.youtube.com/watch?v=HgnkfFWoHwk) — context for the "standard vs GEMSTAR" comparison.

**Exercise:** Build a toy loader — a `UActorComponent` on a "root" actor that, on `BeginPlay`, `Cast`s
its owner, checks a bool, and `SpawnActor`s a manager — then match each line to
[GEMSTAR_Lidar_Loader.cpp](../Plugins/GameFeatures/ue_lidar_feature/Source/ue_lidar_featureRuntime/Private/GEMSTAR_Lidar_Loader.cpp).
(Full walkthrough + a standard-vs-GEMSTAR table in `exercises/phase3.html`.)

**Checkpoint:** Trace in words how an enabled feature's `GEMSTAR_*_Loader` component spawns and
configures its manager at startup — and why it's *not* a `UGameFeatureAction`.

---

## Phase 2.5 — Linking Native Third-Party Libraries (~3–5 h)

> *Chapter 2½ · The Foreign Engines* — esmini and SUMO are bolted-on engines: shipped & ready on Windows, and the reason the machine won't fully start on macOS/Linux.

**Goal:** Understand how GEMSTAR links precompiled native libraries (esmini, SUMO, OSI, protobuf)
into UE via `Build.cs` — why it builds on **Windows** and what a **macOS/Linux** port would take.
*This is GEMSTAR's signature complexity and the prerequisite to any non-Windows build.*

**The four jobs of a ThirdParty `Build.cs`:**

| Call | Role |
|------|------|
| `PublicIncludePaths.Add(...)` | compile-time: lets your C++ `#include` the lib's headers |
| `PublicAdditionalLibraries.Add(...)` | link-time: links the static lib (`.lib`/`.a`/`.dylib`) |
| `RuntimeDependencies.Add(...)` | run-time: copies a runtime DLL next to the binary so it loads |
| `PublicDefinitions.Add(...)` | compile flags, e.g. `GOOGLE_PROTOBUF_NO_RTTI` (protobuf vs UE RTTI) |

**Why it builds on Windows but not macOS:** in [ue_esmini_featureRuntime.Build.cs](../Plugins/GameFeatures/ue_esmini_feature/Source/ue_esmini_featureRuntime/ue_esmini_featureRuntime.Build.cs)
and [GEMSTAR_Interfaces.Build.cs](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/GEMSTAR_Interfaces.Build.cs)
every third-party link sits inside `if (Target.Platform == UnrealTargetPlatform.Win64)` — so on **Windows**
it links and runs. The `Mac` branch is empty/commented and no `.dylib`/`.a` Mac binaries are shipped → on
**macOS** the headers include but nothing links. Not a quick fix; a porting task.

**Exercise:** Dissect both Build.cs files (find the include path, the static-lib link, the runtime DLL
copy, the empty Mac branch), then scope what a Mac port needs. (Walkthrough in `exercises/phase2b.html`.)

**Checkpoint:** Name the four roles above, and explain in one sentence why GEMSTAR builds on Windows
but not on macOS.

---

## Phase 4 — Guided Code Read: the Lidar → Visualizer path (~3–5 h)

> *Chapter 4 · Following the Beam* — Trace one lidar ray from a config number to a dot on screen: the pedestrian scenario in miniature.

**Goal:** Trace one complete data path through real GEMSTAR code. This single trace touches
Actors, interfaces, dispatchers, config, and the OSI flow — the whole architecture in miniature.

**The path to follow:**
```
DefaultGemstar.ini / GemstarLidarTest.ini   (config: what to spawn, sensor params)
        │
        ▼
AGEMSTARRoot                                 reads config, registers managers
        │  (IGEMSTARManager)
        ▼
ALidarSensorManager                          spawns sensors from FSensorConfigData
        │
        ▼
SimpleLidar                                  raycasts → point cloud
        │  (ISensorDataUpdate dispatcher)
        ▼
AVisualizerManager → PointCloudVisualizer    renders points in the viewport
```

**Read, in order:**
1. [GemstarLidarTest.ini](../Plugins/GameFeatures/ue_lidar_feature/Resources/GemstarLidarTest.ini) — the inputs (rays, FOV, range, mounting).
2. [LidarSensorManager.h/.cpp](../Plugins/GameFeatures/ue_lidar_feature/Source/ue_lidar_featureRuntime/Public/LidarSensorManager.h) — config parse + spawn.
3. [SimpleLidar.h/.cpp](../Plugins/GameFeatures/ue_lidar_feature/Source/ue_lidar_featureRuntime/Public/SimpleLidar.h) — the raycasting sensor.
4. [SensorDataDispatcher.h](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/Public/SensorDataDispatcher.h) + [SensorDataUpdate.h](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/Public/SensorDataUpdate.h) — the pub-sub link.
5. [VisualizerManager.h/.cpp](../Plugins/GameFeatures/ue_visualizer_feature/Source/ue_visualizer_featureRuntime/Public/VisualizerManager.h) + [PointCloudVisualizer.h/.cpp](../Plugins/GameFeatures/ue_visualizer_feature/Source/ue_visualizer_featureRuntime/Public/PointCloudVisualizer.h).

**Shortcut in — the `*Tester` classes:** each feature ships a tester/mockup that implements the
dispatcher/update interfaces directly (e.g. [LidarSensorTester.h](../Plugins/GameFeatures/ue_lidar_feature/Source/ue_lidar_featureRuntime/Public/LidarSensorTester.h),
[SensorSpawnerMockup.h](../Plugins/GameFeatures/ue_logger_feature/Source/ue_logger_featureRuntime/Public/SensorSpawnerMockup.h)) —
the easiest standalone way to see one side of the pub-sub in isolation.

**Then trace these yourself (same shape, different mechanics):**
- **Camera:** [CameraSensorManager.h](../Plugins/GameFeatures/ue_camera_feature/Source/ue_camera_featureRuntime/Public/CameraSensorManager.h) → [CameraSensor.h](../Plugins/GameFeatures/ue_camera_feature/Source/ue_camera_featureRuntime/Public/CameraSensor.h) — SceneCapture → RenderTarget (images, not points).
- **Vehicle:** [VehicleManager.h](../Plugins/GameFeatures/ue_vehicle_feature/Source/ue_vehicle_featureRuntime/Public/VehicleManager.h) + [VehicleTableRow.h](../Plugins/GameFeatures/ue_vehicle_feature/Source/ue_vehicle_featureRuntime/Public/VehicleTableRow.h) — a *consumer*: implements `IVehicleDataUpdate`, DataTable lookup → `SpawnActor` a Chaos vehicle. The mirror image of lidar.

**Exercise (if you have a working build — see caveat):** Open the lidar test map, change
`NumberOfRaysHorizontal` in the `.ini`, and observe the change. If you can't build, do it as a
*paper trace*: annotate each file with what data enters and leaves.

**🎥 Watch:** No video for this phase — it's a read of *this* repo's code, which no external tutorial
covers. The hands-on practice *is* the trace above. (Phase 2's “int main() to BeginPlay” video is the
best companion if the actor/lifecycle parts feel unclear.)

**Checkpoint:** Draw the diagram above from memory and name the exact class/file at each arrow.

---

## Phase 5 — The Domain: OSI, esmini, SUMO, sensor simulation (~4–7 h, parallelizable)

> *Chapter 5 · The Common Tongue* — A detection only matters if the outside world can hear it. GEMSTAR speaks OSI.

**Goal:** Understand the non-UE knowledge that makes GEMSTAR a *simulation* tool. You can start
this in parallel with Phase 3–4.

**OSI (ASAM Open Simulation Interface)** — the message standard everything serializes to:
- Skim the OSI docs; understand `GroundTruth`, `SensorView`, `SensorData`, `TrafficUpdate`.
- Look at the message headers in [ThirdParty/osi3/include/osi3/](../Plugins/gemstar_interfaces/ThirdParty/osi3/include/osi3/)
  (e.g. `osi_groundtruth.pb.h`, `osi_sensorview.pb.h`).
- Read [ToOSI.h/.cpp](../Plugins/gemstar_interfaces/Source/GEMSTAR_Interfaces/Public/Utils/ToOSI.h) — the bridge from UE transforms/actors to OSI messages. This is the heart of the integration.

**Protobuf** — how OSI messages are defined & serialized:
- Read a short protobuf intro (messages, fields, serialization). The `.pb.h` files are
  protobuf-generated C++.

**esmini** — OpenSCENARIO/OpenDRIVE scenario player:
- Learn what `.xosc` (scenario) and `.xodr` (road network) files are.

**SUMO** — microscopic traffic simulation:
- Learn the `libsumo` API concept (vehicles, traffic lights stepped each sim tick).

**Domain concepts:** co-simulation, ODD/ODD validation, lidar/camera/radar sensor modeling.

**🎥 Watch — these tools are easiest to grasp in motion:**
- [Introduction to ASAM OSI](https://www.youtube.com/watch?v=0YmUlLM8III) — what OSI is and how it moves data between models in a co-simulation.
- [ASAM OSI trace file](https://www.youtube.com/watch?v=v8WMqEM2U74) — directly relevant: GEMSTAR's logger writes OSI traces to `Output/`.
- [OpenDRIVE Visualization with esmini](https://www.youtube.com/watch?v=pDUVFuMyR5o) — see the scenario engine behind `ue_esmini_feature` in action.
- [SUMO Traffic Simulator — tutorial playlist](https://www.youtube.com/playlist?list=PLAk8GOoajG6tKI74YID0hwjXVg8KBxNAD) — install, build a network, run traffic (the simulator behind `ue_sumo_feature`).

**Checkpoint:** Explain what an OSI `SensorView` contains and how `ToOSI` builds one from the UE world.

---

## Phase 6 — Make a Change (ongoing)

> *Chapter 6 · Your Mark* — The authority's question was about a sensor parameter you can now add. Answer it. You're changing the machine now, not reading it.

**Goal:** Go from reader to contributor. Pick increasingly invasive tasks:
1. Add a new config key to a sensor `.ini` and consume it in the manager (e.g. a lidar
   intensity threshold). Smallest real change.
2. Add a `UE_LOG` trace through the lidar→visualizer path to watch data move at runtime.
3. Add a tiny new field to an OSI conversion in `ToOSI` and log it from the logger.
4. (Advanced) Sketch a new sensor feature plugin mirroring `ue_lidar_feature`'s structure.

**Checkpoint:** You can describe, before writing code, which files a given feature change
touches and why.

---

## Platform Reality

The **learning** in every phase is identical on all platforms — only whether the full project
*compiles and runs* differs.

| Platform | Builds & runs? | Toolchain / notes |
|----------|----------------|-------------------|
| **Windows** (documented platform) | ✅ **Everything**, incl. esmini & SUMO | VS 2022 · `PostGitPull_ReGenVSFiles.bat` → `GEMSTAR.sln`. Win64 libs ship in the repo. Smoothest path. |
| **macOS** | ⚠️ Pure-UE features only (lidar, visualizer, vehicle, camera) | Xcode · `PostGitPull_ReGenXcodeFiles.command` → `.xcworkspace`. esmini/SUMO/OSI/protobuf ship **Windows-only** binaries — those need a port (Phase 2.5). |
| **Linux** | ⚠️ Partial | Some libs ship a `.a` (e.g. esmini); OSI/SUMO branches incomplete. |

- **On Windows:** ignore any "do it as a paper trace" note — you can build and run for real, including
  the full esmini/SUMO co-simulation.
- **On macOS:** the native-library features (`gemstar_interfaces`, `ue_esmini_feature`,
  `ue_sumo_feature`) fail to link because only Windows binaries ship (no `.dylib`/`.a`). Stick to the
  **lidar/visualizer/vehicle/camera** path (pure UE built-ins), or take on the Phase 2.5 port.
- **This guide was authored on** an Intel Mac (x86_64) with a UE 5.7.4 source build, so a few examples
  show macOS paths — substitute your own engine/repo location on Windows (`Engine\Binaries\Win64\UnrealEditor.exe`,
  `C:\…\gemstar`). The in-browser "open file" links auto-detect your repo path, so they work either way.

---

## Appendix — Data Flow Cheat Sheet

```
esmini / SUMO ──vehicle state──▶ AEsminiManager / ASUMOManager
                                         │ (IVehicleDataDispatcher)
                                         ▼
                                  AVehicleManager ─▶ spawns/updates Chaos vehicles
SUMO ──traffic lights──▶ (ITrafficLightDataDispatcher) ─▶ traffic light actors

Camera / Lidar managers ─spawn sensors─▶ capture images / raycast point clouds
                                         │ (ISensorDataUpdate)
                         ┌───────────────┴───────────────┐
                         ▼                                ▼
                   ALogManager                     AVisualizerManager
          (OSI GroundTruth + SensorView           (renders point cloud
           → binary trace in Output/)              in the viewport)

AGEMSTARRoot ─ orchestrates all managers via IGEMSTARManager + DefaultGemstar.ini
```

**Key idea:** simulators *produce* data via dispatchers; vehicles/loggers/visualizers *consume*
it via update interfaces. OSI is the common message format. Plugins never reference each other —
only `gemstar_interfaces`. That decoupling is the whole point of the architecture.
