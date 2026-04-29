// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyMindClient",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [
        .library(name: "MyMindClient", targets: ["MyMindClient"]),
    ],
    targets: [
        .target(
            name: "MyMindClient",
            path: "src"
        ),
        .testTarget(
            name: "MyMindClientTests",
            dependencies: ["MyMindClient"],
            path: "tests"
        ),
    ],
    swiftLanguageModes: [.v6]
)
