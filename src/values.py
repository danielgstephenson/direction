import torch
import numpy as np
import os

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("device = " + str(device))

def clamp(x, a, b):
	return max(a, min(x, b))

gridSize = 5
unitCount = 6
maxRound = 48
actionSpace = torch.tensor([0, 1, 2, 3], dtype=torch.int).to(device)
actionCount = 4
actionVecs = torch.tensor([[1,0],[0,1],[-1,0],[0,-1]], dtype=torch.int).to(device)
gridVecs = torch.tensor(
	[[x,y] for x in range(gridSize) for y in range(gridSize)],
	dtype=torch.int
).to(device)
gridCount = gridVecs.size()[0]
gridLocs = torch.tensor([loc for loc in range(gridCount)], dtype=torch.int).to(device)

vecToLoc = torch.zeros((gridSize, gridSize),dtype=torch.int).to(device)
for loc in gridLocs:
	vec = gridVecs[loc]
	vecToLoc[vec[0], vec[1]] = loc

shift = torch.zeros((gridCount,actionCount),dtype=torch.int).to(device)
for loc in gridLocs:
	for dir in actionSpace:
		gridVec = gridVecs[loc]
		actionVec = actionVecs[dir]
		x = clamp(gridVec[0] + actionVec[0], 0, gridSize-1)
		y = clamp(gridVec[1] + actionVec[1], 0, gridSize-1)
		shift[loc,dir] = vecToLoc[x, y]

def moveToEnd(tensor_1d, index):
	indices = torch.arange(tensor_1d.size()[0]).to(device)
	matches = torch.where(indices==index,1,0)
	sorted_indices = torch.argsort(matches, stable=True)
	sorted = torch.gather(tensor_1d, 0, sorted_indices)
	return sorted

def stateToLocs(state):
	options = gridLocs.clone()
	s = state
	locs = torch.tensor([], dtype=torch.int).to(device)
	for unitIndex in range(unitCount):
		optionCount = gridCount - unitIndex
		i = (s % optionCount).view(1)
		s = (s-i) // optionCount
		locs = torch.cat((locs, options[i]))
		options = moveToEnd(options,i)
	return locs

optionCounts = torch.tensor(
	[gridCount - r for r in range(unitCount)], 
	dtype=torch.int32
).to(device)

stateCount = torch.prod(optionCounts,dtype=torch.int32).to(device)

coefficients = torch.tensor(
	[torch.prod(optionCounts[0:i]) for i in range(unitCount)],
	dtype=torch.int32
).to(device)

def locsToState (locs):
	options = gridLocs.clone()
	total = 0
	for unitIndex in range(unitCount):
		loc = locs[unitIndex]
		optionIndex = torch.nonzero(torch.where(options == loc, 1, 0))[0] # Make compatible with vmap
		options = torch.cat((options[:optionIndex],options[optionIndex+1:]))
		coefficient = coefficients[unitIndex]
		total += optionIndex * coefficient
	return total.to(dtype=torch.int32)

def getOutcome (state, action):
	locs = stateToLocs(state)
	movers = torch.tensor([0], dtype=torch.int).to(device)
	oldLoc = locs[0]
	for _ in range(unitCount):
		nextLoc = shift[oldLoc,action]
		if nextLoc == oldLoc:
			movers = []
			break
		obstacles = torch.nonzero(torch.where(locs == nextLoc, 1, 0))
		if obstacles.size()[0] == 0:
			break
		movers = torch.cat((movers, obstacles[0]))
		oldLoc = nextLoc
	for mover in movers:
		loc = locs[mover]
		locs[mover] = shift[loc,action]
	actorLoc = locs[0]
	locs = locs[1:]
	locs = torch.cat((locs, actorLoc.unsqueeze(0)))
	return locsToState(locs)


def getOutcomes(state):
	s0 = getOutcome(state, actionSpace[0])
	s1 = getOutcome(state, actionSpace[1])
	s2 = getOutcome(state, actionSpace[2])
	s3 = getOutcome(state, actionSpace[3])
	return torch.tensor([s0,s1,s2,s3]).to(device)

def getValue0 (goals, state):
	print('goals',goals)
	print('state',state)
	locs = stateToLocs(state)
	myLocs = locs[[0,2,4]]
	otherLocs = locs[[1,3,5]]
	myScore = torch.isin(goals,myLocs).sum()
	otherScore = torch.isin(goals,otherLocs).sum()
	if(myScore == 2): return 100
	if(otherScore == 2): return -100
	return 0

states = torch.tensor(range(stateCount),dtype=torch.int32).to(device)
goals = torch.tensor([12, 13],dtype=torch.int).to(device)
values = torch.zeros(stateCount, dtype=torch.int8).to(device)

os.system('clear')

def testGetOutcome (state, action):
	locs = stateToLocs(state)
	stepLoc = locs[0].clone().view(1)
	path = torch.tensor([], dtype=torch.int).to(device)
	for _ in range(gridSize):
		path = torch.cat((path,stepLoc))
		stepLoc = shift[stepLoc.view(1),action.view(1)]
	occupied = torch.isin(path,locs)
	blocked = torch.all(occupied)
	moving = torch.cumprod(torch.isin(locs,path),0).to(torch.bool) 
	moving = moving & ~blocked
	shifted = shift[locs, action.view(1)]
	moved = torch.where(moving, shifted, locs)
	cycled = moveToEnd(moved, 0)
	return locsToState(cycled)

def testGetOutcomes(state):
	s0 = testGetOutcome(state, actionSpace[0])
	s1 = testGetOutcome(state, actionSpace[1])
	s2 = testGetOutcome(state, actionSpace[2])
	s3 = testGetOutcome(state, actionSpace[3])
	return torch.tensor([s0,s1,s2,s3]).to(device)

state = states[63032467]
stateToLocs(state)
getOutcome(state, actionSpace[3])
testGetOutcome(state, actionSpace[3])

testStates = states[63032467:63032470]
testStates
torch.vmap(testGetOutcomes,in_dims=0)(testStates)

# state 63032467
# locs [ 17, 2, 14, 15, 22, 10 ]
# vectors [
#   { x: 3, y: 2 },
#   { x: 0, y: 2 },
#   { x: 2, y: 4 },
#   { x: 3, y: 0 },
#   { x: 4, y: 2 },
#   { x: 2, y: 0 }
# ]
# action 3
# outcome 79509927

# Update all function to be compatible with vmap
# Construct the initial value tensor using torch.vmap
# Perform value interation using torch.vmap

# [0  1  3  4  5  6  7  8  9 10 11 12 14 15 16 18 19 20 21 22 23 24]
# [0  1  3  4  5  6  7  8  9 10 11 12 13 16 18 19 20 21 22 23 24]
