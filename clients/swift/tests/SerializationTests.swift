import Foundation
import Testing
@testable import MyMindClient

@Suite("CreateObjectRequest serialization")
struct SerializationTests {
    private func encode(_ req: CreateObjectRequest) throws -> [String: Any] {
        let data = try JSONEncoder().encode(req)
        return try JSONSerialization.jsonObject(with: data) as! [String: Any]
    }

    @Test("Encodes url as string")
    func encodesUrl() throws {
        let req = CreateObjectRequest(url: URL(string: "https://example.com/page")!)
        let json = try encode(req)
        #expect(json["url"] as? String == "https://example.com/page")
    }

    @Test("Omits nil fields")
    func omitsNilFields() throws {
        let req = CreateObjectRequest(title: "Hello")
        let json = try encode(req)

        #expect(json["title"] as? String == "Hello")
        #expect(json["url"] == nil)
        #expect(json["content"] == nil)
        #expect(json["tags"] == nil)
        #expect(json["spaces"] == nil)
    }

    @Test("Excludes blob from JSON body")
    func excludesBlob() throws {
        let req = CreateObjectRequest(
            title: "Photo",
            blob: Blob(data: Data([0x89, 0x50, 0x4E, 0x47]), type: "image/png", name: "photo.png")
        )
        let json = try encode(req)

        #expect(json["blob"] == nil)
        #expect(json["title"] as? String == "Photo")
    }

    @Test("Encodes tags and spaces")
    func encodesTagsAndSpaces() throws {
        let req = CreateObjectRequest(
            tags: [ObjectTag(name: "reading")],
            spaces: [ObjectSpace(id: "sp_123")]
        )
        let json = try encode(req)

        let tags = json["tags"] as! [[String: Any]]
        let spaces = json["spaces"] as! [[String: Any]]
        #expect(tags[0]["name"] as? String == "reading")
        #expect(spaces[0]["id"] as? String == "sp_123")
    }
}
