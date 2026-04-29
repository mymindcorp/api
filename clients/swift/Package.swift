// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyMindClient",
    platforms: [.macOS(.v14), .iOS(.v17)],
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
