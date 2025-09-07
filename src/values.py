import torch
import numpy as np

class Vec2:
	def __init__(self, x, y):
		self.x = int(x)
		self.y = int(y)

def clamp(x, a, b):
	return max(a, min(x, b))

gridSize = 5
unitCount = 6
maxRound = 48
actionSpace = np.array([0, 1, 2, 3], np.uint8)
actionCount = len(actionSpace)
actionVecs = [Vec2(1,0),Vec2(0,1),Vec2(-1,0),Vec2(0,-1)]

gridVecs = [Vec2(x,y) for x in range(gridSize) for y in range(gridSize)]
gridCount = len(gridVecs)
gridLocs = np.array([loc for loc in range(gridCount)], dtype=np.uint8)

vecToLoc = np.zeros((gridSize, gridSize),dtype=np.uint8)
for loc in gridLocs:
	vec = gridVecs[loc]
	vecToLoc[vec.x, vec.y] = loc

shift = np.zeros((gridCount,actionCount),dtype=np.uint8)
for loc in gridLocs:
	for dir in actionSpace:
		gridVec = gridVecs[loc]
		actionVec = actionVecs[dir]
		x = clamp(gridVec.x + actionVec.x, 0, gridSize-1)
		y = clamp(gridVec.y + actionVec.y, 0, gridSize-1)
		shift[loc,dir] = vecToLoc[x, y]

def stateToLocs(state):
	options = gridLocs.copy()
	s = int(state)
	locs = np.array([], dtype=np.uint8)
	for _ in range(unitCount):
		optionCount = len(options)
		i = s % optionCount
		s = (s-i) // optionCount
		locs = np.append(locs, options[i])
		options = np.delete(options,i) 
	return locs

optionCounts = np.array([gridCount - r for r in range(unitCount)])
stateCount = np.prod(optionCounts)
coefficients = np.array([int(np.prod(optionCounts[0:i])) for i in range(unitCount)])

def locsToState (locs):
	options = gridLocs.copy()
	total = 0
	for unitIndex, loc in enumerate(locs):
		optionIndex = np.where(options == loc)[0]
		options = np.delete(options, optionIndex)
		coefficient = coefficients[unitIndex]
		total += optionIndex * coefficient
	return total

def getOutcome (state, action):
	locs = stateToLocs(state)
	movers = np.array([0], dtype=np.uint8)
	oldLoc = locs[0]
	for _ in range(unitCount):
		nextLoc = shift[oldLoc][action]
		if nextLoc == oldLoc:
			movers = []
			break
		obstacles = np.where(locs == nextLoc)[0]
		if len(obstacles) == 0:
			break
		movers = np.append(movers, obstacles[0])
		oldLoc = nextLoc
	for mover in movers:
		loc = locs[mover]
		locs[mover] = shift[loc,action]
	actorLoc = locs[0]
	locs = np.delete(locs, 0)
	locs = np.append(locs, actorLoc)
	return locsToState(locs)

state = 63032467
outcome = getOutcome(state, 1)
values = torch.zeros(stateCount, dtype=torch.uint8)
values[outcome] = 100


# Next, define the getScore function
# Then, define the initial value tensor
# Then, perform value function interation 
