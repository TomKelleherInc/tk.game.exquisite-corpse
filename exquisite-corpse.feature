Feature: Exquisite Corpse Drawing Game

   Scenario: Host creates a new game and gets invite link
      Given I am an unauthenticated user
      When I POST to /api/games/create
      Then I receive a JSON response with "gameId" and "inviteLink"
      And the "inviteLink" is a valid URL containing the "gameId"

   Scenario: Artist joins a game and enters their name
      Given a game exists with gameId "ABC123"
      And I navigate to /games/ABC123 without a name
      When I submit name "Alice"
      Then I see a waiting screen listing "Alice" as a joined player

   Scenario: Artist claims and submits a panel
      Given players ["Alice","Bob"] have joined game "ABC123"
      And no panels are claimed
      When Alice clicks "Claim Next Panel"
      Then Alice is assigned panel number 1
      And other participants see "Alice has claimed Panel 1"
      When Alice draws on a 1000×800 canvas with top 50 px blank overlap
      And Alice clicks "Submit Panel"
      Then the server stores a PNG for Panel 1
      And Panel 1 is marked read‑only for Alice
      And all participants see "Alice submitted Panel 1"

   Scenario: Subsequent artist draws with overlap
      Given panel 1 PNG from Alice is stored
      And Bob joins game "ABC123"
      When Bob clicks "Claim Next Panel"
      Then Bob is assigned panel 2
      And Bob’s canvas shows the bottom 50 px of Panel 1 at the top
      And Bob can draw the rest blank

   Scenario: Host previews and publishes final canvas
      Given all joined artists have submitted their panels
      When Host clicks "Preview Final Canvas"
      Then I see the stitched artwork combining all panels vertically
      When Host clicks "Publish Canvas"
      Then all participants see the final image at /games/ABC123/final

   Scenario: Artist claims the next panel
      Given game "ABC-DEF-GHI" exists and players ["Alice"] have joined
      When I POST to /api/games/ABC-DEF-GHI/claim with body:
         """
         {
            "name": "Alice"
         }
         """
      Then I receive a 201 response with JSON containing:
         | gameId            | ABC-DEF-GHI |
         | panel.panelNumber | 1           |
         | panel.claimedBy   | Alice       |
         | panel.status      | claimed     |
      And a Socket.io "panelClaimed" event is emitted with:
         | gameId      | ABC-DEF-GHI |
         | panelNumber | 1           |
         | claimedBy   | Alice       |

   Scenario: Artist joins a game by name
      Given a game exists with gameId "ABC-DEF-GHI"
      When I POST to /api/games/ABC-DEF-GHI/join with body:
         """
         {
            "name": "Alice"
         }
         """
      Then I receive a 200 response with JSON containing:
         | gameId  | ABC-DEF-GHI |
         | players | ["Alice"]   |
         | status  | waiting     |

  Scenario: Artist submits their drawn panel
    Given Alice has claimed panel 1 in game "ABC-DEF-GHI"
    When I POST to /api/games/ABC-DEF-GHI/submit with body:
      """
      { "name":"Alice", "imageData":"data:image/png;base64,iVBORw0KGgo..." }
      """
    Then I receive a 200 response with JSON containing:
      | gameId           | ABC-DEF-GHI |
      | panel.panelNumber| 1           |
      | panel.status     | submitted   |
    And a Socket.io "panelSubmitted" event is emitted with:
      | gameId           | ABC-DEF-GHI |
      | panelNumber      | 1           |
      | claimedBy        | Alice       |
