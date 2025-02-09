import pygame
import pymunk
import pymunk.pygame_util
import math

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((800, 600))
clock = pygame.time.Clock()

# Create physics space
space = pymunk.Space()
space.gravity = (0, 981)  # Gravity (pixels per second squared)

# Create static bar
bar_body = pymunk.Body(body_type=pymunk.Body.STATIC)
bar_body.position = (400, 100)
bar_shape = pymunk.Segment(bar_body, (-120, 0), (120, 0), 5)
space.add(bar_body, bar_shape)

# Ball parameters
num_balls = 5
radius = 15
rod_length = 150

# Create balls and joints
balls = []
for i in range(num_balls):
    # Calculate pivot point on the bar
    pivot_x = -60 + 30 * i  # Local to bar body
    pivot_world_x = 400 + pivot_x  # World x-coordinate
    
    # Create ball body
    body = pymunk.Body()
    body.position = (pivot_world_x, 100 + rod_length)
    
    # Set initial position for first ball
    if i == 0:
        angle = math.radians(-30)  # Initial angle (30 degrees left)
        body.position = (
            pivot_world_x + rod_length * math.sin(angle),
            100 + rod_length * math.cos(angle)
        )
    
    # Create ball shape
    shape = pymunk.Circle(body, radius)
    shape.mass = 1
    shape.elasticity = 1.0  # Perfectly elastic collisions
    shape.friction = 0.0
    space.add(body, shape)
    
    # Create joint between bar and ball
    joint = pymunk.PinJoint(bar_body, body, (pivot_x, 0), (0, 0))
    space.add(joint)
    
    balls.append(body)

# Set up drawing options
draw_options = pymunk.pygame_util.DrawOptions(screen)

# Main loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Clear screen
    screen.fill((255, 255, 255))
    
    # Draw physics objects
    space.debug_draw(draw_options)
    
    # Update physics
    space.step(1/60.0)
    
    # Update display
    pygame.display.flip()
    clock.tick(60)

pygame.quit()